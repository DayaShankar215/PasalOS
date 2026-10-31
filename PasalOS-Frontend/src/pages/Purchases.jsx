
import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  X,
  Trash2,
  Truck,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'

import { usePurchases } from '../hooks/usePurchases'
import { useProducts } from '../hooks/useProducts'
import { useSuppliers } from '../hooks/useSuppliers'
import { useStockMovements } from '../hooks/useStockMovements'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'
import { formatCurrency } from '../utils/currency'

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Received: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const EMPTY_ITEM = {
  productId: '',
  quantity: 1,
  costPrice: '',
}

function createPurchaseNumber() {
  return `PUR-${Date.now().toString().slice(-8)}`
}

function formatDate(date) {
  if (!date) return '—'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return '—'

  return parsedDate.toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Purchases() {
  const [purchases, setPurchases] = usePurchases()
  const [products, setProducts] = useProducts()
  const [suppliers] = useSuppliers()
  const [, setMovements] = useStockMovements()

  const { user } = useAuth()

  const canViewPurchases = hasPermission(user?.role, 'purchases', 'view')
  const canManagePurchases = hasPermission(user?.role, 'purchases', 'full')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)

  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [error, setError] = useState('')

  const safePurchases = Array.isArray(purchases) ? purchases : []
  const safeProducts = Array.isArray(products) ? products : []
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : []

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase()

    return safePurchases.filter((purchase) => {
      const matchesSearch =
        !query ||
        String(purchase.purchaseNumber || '').toLowerCase().includes(query) ||
        String(purchase.supplierName || '').toLowerCase().includes(query) ||
        (Array.isArray(purchase.items) &&
          purchase.items.some((item) =>
            String(item.productName || '').toLowerCase().includes(query)
          ))

      const matchesStatus =
        statusFilter === 'All' || purchase.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [safePurchases, search, statusFilter])

  const totalPurchases = safePurchases.length

  const pendingPurchases = safePurchases.filter(
    (purchase) => purchase.status === 'Pending'
  ).length

  const receivedPurchases = safePurchases.filter(
    (purchase) => purchase.status === 'Received'
  ).length

  const totalSpent = safePurchases
    .filter((purchase) => purchase.status === 'Received')
    .reduce((sum, purchase) => sum + Number(purchase.total || 0), 0)

  function resetForm() {
    setSupplierId('')
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setItems([{ ...EMPTY_ITEM }])
    setError('')
  }

  function openCreateModal() {
    if (!canManagePurchases) return

    resetForm()
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setError('')
  }

  function updateItem(index, field, value) {
    if (!canManagePurchases) return

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        const updatedItem = { ...item, [field]: value }

        if (field === 'productId') {
          const product = safeProducts.find(
            (product) => String(product.id) === String(value)
          )

          updatedItem.costPrice = product
            ? String(product.costPrice ?? '')
            : ''
        }

        return updatedItem
      })
    )
  }

  function addItem() {
    if (!canManagePurchases) return

    setItems((currentItems) => [
      ...currentItems,
      { ...EMPTY_ITEM },
    ])
  }

  function removeItem(index) {
    if (!canManagePurchases) return

    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const formTotal = items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.quantity) || 0) *
        Math.max(0, Number(item.costPrice) || 0),
    0
  )

  function savePurchase(event) {
    event.preventDefault()

    if (!canManagePurchases) return

    setError('')

    const supplier = safeSuppliers.find(
      (item) => String(item.id) === String(supplierId)
    )

    if (!supplier) {
      setError('Please select a supplier.')
      return
    }

    if (!purchaseDate) {
      setError('Please select a purchase date.')
      return
    }

    if (!items.length) {
      setError('Please add at least one product.')
      return
    }

    const purchaseItems = []

    for (const item of items) {
      const product = safeProducts.find(
        (product) => String(product.id) === String(item.productId)
      )

      const quantity = Number(item.quantity)
      const costPrice = Number(item.costPrice)

      if (!product) {
        setError('Please select a valid product for every item.')
        return
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError('Each product quantity must be greater than zero.')
        return
      }

      if (!Number.isFinite(costPrice) || costPrice < 0) {
        setError('Purchase cost must be zero or greater.')
        return
      }

      purchaseItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        quantity,
        costPrice,
        subtotal: quantity * costPrice,
      })
    }

    const newPurchase = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      purchaseNumber: createPurchaseNumber(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: purchaseDate,
      items: purchaseItems,
      total: purchaseItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      ),
      status: 'Pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    }

    setPurchases((currentPurchases) => [
      newPurchase,
      ...(Array.isArray(currentPurchases) ? currentPurchases : []),
    ])

    closeModal()
    resetForm()
  }

  function receivePurchase(purchase) {
    if (!canManagePurchases) return
    if (purchase.status !== 'Pending') return

    const confirmed = window.confirm(
      `Mark ${purchase.purchaseNumber} as received?\n\nThis will add the purchased quantities to inventory.`
    )

    if (!confirmed) return

    // Re-check the latest purchase status before updating stock.
    const currentPurchase = safePurchases.find(
      (item) => item.id === purchase.id
    )

    if (!currentPurchase || currentPurchase.status !== 'Pending') return

    const productUpdates = []
    const movementRecords = []

    for (const item of currentPurchase.items || []) {
      const product = safeProducts.find(
        (product) => String(product.id) === String(item.productId)
      )

      if (!product) {
        window.alert(
          `Cannot receive this purchase because "${item.productName}" no longer exists in Products.`
        )
        return
      }

      const previousStock = Number(product.stock) || 0
      const quantity = Number(item.quantity)

      if (!Number.isFinite(quantity) || quantity <= 0) {
        window.alert(
          `Cannot receive this purchase because "${item.productName}" has an invalid quantity.`
        )
        return
      }

      const newStock = previousStock + quantity

      productUpdates.push({
        productId: product.id,
        previousStock,
        newStock,
      })

      movementRecords.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        type: 'Stock Added',
        quantity,
        previousStock,
        newStock,
        reason: `Purchase ${currentPurchase.purchaseNumber}`,
        date: new Date().toISOString(),
      })
    }

    // Update inventory stock.
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const update = productUpdates.find(
          (item) => String(item.productId) === String(product.id)
        )

        return update
          ? { ...product, stock: update.newStock }
          : product
      })
    )

    // Record stock movement history.
    setMovements((currentMovements) => [
      ...movementRecords,
      ...(Array.isArray(currentMovements) ? currentMovements : []),
    ])

    // Mark the purchase as received.
    setPurchases((currentPurchases) =>
      currentPurchases.map((item) =>
        item.id === currentPurchase.id && item.status === 'Pending'
          ? {
              ...item,
              status: 'Received',
              receivedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  function cancelPurchase(purchase) {
    if (!canManagePurchases) return

    if (purchase.status !== 'Pending') {
      window.alert('Only pending purchases can be cancelled.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel ${purchase.purchaseNumber}?`
    )

    if (!confirmed) return

    setPurchases((currentPurchases) =>
      currentPurchases.map((item) =>
        item.id === purchase.id && item.status === 'Pending'
          ? { ...item, status: 'Cancelled' }
          : item
      )
    )
  }

  function exportCSV() {
    if (!canManagePurchases || filteredPurchases.length === 0) return

    const headers = [
      'Purchase Number',
      'Supplier',
      'Date',
      'Products',
      'Total',
      'Status',
      'Notes',
    ]

    const rows = filteredPurchases.map((purchase) => [
      purchase.purchaseNumber,
      purchase.supplierName,
      purchase.date,
      (purchase.items || [])
        .map((item) => `${item.productName} x ${item.quantity}`)
        .join('; '),
      purchase.total,
      purchase.status,
      purchase.notes || '',
    ])

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\r\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'pasalos-purchases.csv'

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const statCards = [
    {
      label: 'Total Purchases',
      value: totalPurchases,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Pending',
      value: pendingPurchases,
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Received',
      value: receivedPurchases,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: Package,
      color: 'bg-violet-100 text-violet-700',
    },
  ]

  // Restrict access to unauthorized roles.
  if (!canViewPurchases) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert size={28} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Access Restricted
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to access the Purchases module.
            Please contact your shop owner if you need access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage supplier purchases and update inventory when goods arrive.
          </p>
        </div>

        {canManagePurchases && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Purchase
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                <div className={`rounded-lg p-3 ${card.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Purchase list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search purchase, supplier, or product..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {canManagePurchases && (
              <button
                type="button"
                onClick={exportCSV}
                disabled={filteredPurchases.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Purchase</th>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.map((purchase) => {
                const purchaseItems = Array.isArray(purchase.items)
                  ? purchase.items
                  : []

                return (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {purchase.purchaseNumber || '—'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {purchaseItems.length} product
                        {purchaseItems.length !== 1 ? 's' : ''}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {purchase.supplierName || '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(purchase.date)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {purchaseItems
                        .slice(0, 2)
                        .map((item) => item.productName)
                        .join(', ')}
                      {purchaseItems.length > 2
                        ? ` +${purchaseItems.length - 2} more`
                        : ''}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatCurrency(purchase.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[purchase.status] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {purchase.status || 'Unknown'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="View purchase"
                          aria-label={`View ${purchase.purchaseNumber || 'purchase'}`}
                          onClick={() => setSelectedPurchase(purchase)}
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                        >
                          <Eye size={17} />
                        </button>

                        {canManagePurchases &&
                          purchase.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                title="Mark as received"
                                onClick={() => receivePurchase(purchase)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Truck size={17} />
                              </button>

                              <button
                                type="button"
                                title="Cancel purchase"
                                onClick={() => cancelPurchase(purchase)}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <XCircle size={17} />
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-full bg-gray-100 p-4">
                        <ShoppingCart size={28} className="text-gray-400" />
                      </div>

                      <p className="mt-4 font-semibold text-gray-800">
                        No purchases found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {search || statusFilter !== 'All'
                          ? 'Try changing your search or status filters.'
                          : 'Create your first purchase to get started.'}
                      </p>

                      {!search &&
                        statusFilter === 'All' &&
                        canManagePurchases && (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            <Plus size={17} />
                            New Purchase
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-5 py-3 text-sm text-gray-500">
          Showing {filteredPurchases.length} of {safePurchases.length} purchases
        </div>
      </div>

      {/* Create purchase modal */}
      {canManagePurchases && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Create Purchase
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add products received from your supplier.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close purchase form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={savePurchase} className="space-y-5 p-5">
              {safeSuppliers.length === 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle size={19} className="shrink-0" />
                  Add a supplier in the Suppliers module before creating a
                  purchase.
                </div>
              )}

              {safeProducts.length === 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle size={19} className="shrink-0" />
                  Add products in the Products module before creating a
                  purchase.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Supplier <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select supplier</option>
                    {safeSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        {supplier.company ? ` — ${supplier.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Purchase Items
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const selectedProduct = safeProducts.find(
                      (product) =>
                        String(product.id) === String(item.productId)
                    )

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-5">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Product
                            </label>

                            <select
                              value={item.productId}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  'productId',
                                  event.target.value
                                )
                              }
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">Select product</option>

                              {safeProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                  {product.sku ? ` (${product.sku})` : ''}
                                </option>
                              ))}
                            </select>

                            {selectedProduct && (
                              <p className="mt-1 text-xs text-gray-500">
                                Current stock: {selectedProduct.stock ?? 0}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  'quantity',
                                  event.target.value
                                )
                              }
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Cost per Unit (NPR)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  'costPrice',
                                  event.target.value
                                )
                              }
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-end justify-between gap-2 sm:col-span-2 sm:flex-col sm:items-end">
                            <div>
                              <p className="text-xs text-gray-500">Subtotal</p>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(
                                  Math.max(0, Number(item.quantity) || 0) *
                                    Math.max(0, Number(item.costPrice) || 0)
                                )}
                              </p>
                            </div>

                            {items.length > 1 && (
                              <button
                                type="button"
                                title="Remove item"
                                onClick={() => removeItem(index)}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>

                <textarea
                  rows="2"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Enter invoice number or other purchase details..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    Purchase Total
                  </span>

                  <span className="text-xl font-bold text-blue-700">
                    {formatCurrency(formTotal)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  This purchase will be saved as Pending. Inventory changes
                  only when you mark it as Received.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    safeSuppliers.length === 0 || safeProducts.length === 0
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View purchase details */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedPurchase.purchaseNumber}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Purchase details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                aria-label="Close purchase details"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedPurchase.supplierName || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(selectedPurchase.date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[selectedPurchase.status] ||
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedPurchase.status || 'Unknown'}
                  </span>
                </div>

                {selectedPurchase.receivedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Received On</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(selectedPurchase.receivedAt)}
                    </p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-112.5 text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {(selectedPurchase.items || []).map((item, index) => (
                      <tr key={`${item.productId}-${index}`}>
                        <td className="px-4 py-3 text-gray-800">
                          {item.productName || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(item.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPurchase.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedPurchase.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="font-semibold text-gray-800">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(selectedPurchase.total)}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
