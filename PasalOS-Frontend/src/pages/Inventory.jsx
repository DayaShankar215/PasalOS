
import { useMemo, useState } from 'react'
import {
  Search,
  Package,
  Boxes,
  AlertTriangle,
  CircleX,
  Plus,
  Minus,
  ArrowDownToLine,
  X,
} from 'lucide-react'

import { useProducts } from '../hooks/useProducts'
import { useStockMovements } from '../hooks/useStockMovements'
import { productCategories } from '../data/mockData'
import { formatCurrency } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

export default function Inventory() {
  // Authentication and permissions
  const { user } = useAuth()

  const canManageInventory = hasPermission(
    user?.role,
    'inventory',
    'full'
  )

  // Shared product and stock movement states
  const [products, setProducts] = useProducts()
  const [, setMovements] = useStockMovements()

  // Filter states
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [stockStatus, setStockStatus] = useState('All')

  // Stock adjustment states
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [adjustmentType, setAdjustmentType] = useState('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('New stock received')
  const [error, setError] = useState('')

  const LOW_STOCK_LIMIT = 10

  // Calculate total stock units
  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  )

  // Calculate low stock products
  const lowStockCount = products.filter((product) => {
    const stock = Number(product.stock || 0)
    return stock > 0 && stock <= LOW_STOCK_LIMIT
  }).length

  // Calculate out-of-stock products
  const outOfStockCount = products.filter(
    (product) => Number(product.stock || 0) <= 0
  ).length

  // Search and filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchTerm = search.toLowerCase()

      const matchesSearch =
        String(product.name || '').toLowerCase().includes(searchTerm) ||
        String(product.sku || '').toLowerCase().includes(searchTerm)

      const matchesCategory =
        category === 'All' || product.category === category

      const stock = Number(product.stock || 0)

      const matchesStatus =
        stockStatus === 'All' ||
        (stockStatus === 'In Stock' && stock > LOW_STOCK_LIMIT) ||
        (stockStatus === 'Low Stock' &&
          stock > 0 &&
          stock <= LOW_STOCK_LIMIT) ||
        (stockStatus === 'Out of Stock' && stock <= 0)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, category, stockStatus])

  // Open stock adjustment modal
  function openAdjustment(product, type) {
    if (!canManageInventory) return

    setSelectedProduct(product)
    setAdjustmentType(type)
    setQuantity('')

    setReason(
      type === 'add' ? 'New stock received' : 'Stock correction'
    )

    setError('')
  }

  // Close stock adjustment modal
  function closeAdjustment() {
    setSelectedProduct(null)
    setQuantity('')
    setError('')
  }

  // Save stock adjustment
  function saveAdjustment(event) {
    event.preventDefault()

    // Permission protection
    if (!canManageInventory) return

    if (!selectedProduct) return

    const amount = Number(quantity)

    // Validate quantity
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter a whole number greater than zero.')
      return
    }

    // Find the latest product information
    const currentProduct = products.find(
      (product) => product.id === selectedProduct.id
    )

    if (!currentProduct) {
      setError(
        'This product could not be found. Please refresh the page.'
      )
      return
    }

    const previousStock = Number(currentProduct.stock || 0)

    // Calculate updated stock
    const newStock =
      adjustmentType === 'add'
        ? previousStock + amount
        : previousStock - amount

    // Prevent negative stock
    if (newStock < 0) {
      setError('Stock cannot be reduced below zero.')
      return
    }

    // Create stock movement record
    const movement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId: currentProduct.id,
      productName: currentProduct.name,
      sku: currentProduct.sku || '',
      type:
        adjustmentType === 'add'
          ? 'Stock Added'
          : 'Stock Removed',
      quantity: amount,
      previousStock,
      newStock,
      reason,
      date: new Date().toISOString(),
    }

    // Update shared product stock
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === currentProduct.id
          ? { ...product, stock: newStock }
          : product
      )
    )

    // Save stock movement history
    setMovements((currentMovements) => [
      movement,
      ...currentMovements,
    ])

    // Close modal after successful adjustment
    closeAdjustment()
  }

  // Export filtered inventory as CSV
  function exportInventory() {
    const headers = [
      'Product',
      'SKU',
      'Category',
      'Current Stock',
      'Unit',
      'Selling Price',
      'Stock Status',
    ]

    const rows = filteredProducts.map((product) => {
      const stock = Number(product.stock || 0)

      const status =
        stock <= 0
          ? 'Out of Stock'
          : stock <= LOW_STOCK_LIMIT
            ? 'Low Stock'
            : 'In Stock'

      return [
        product.name,
        product.sku,
        product.category,
        stock,
        product.unit,
        product.sellingPrice,
        status,
      ]
    })

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'pasalos-inventory.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  // Inventory summary cards
  const summaryCards = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Units',
      value: totalUnits.toLocaleString(),
      icon: Boxes,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Low Stock',
      value: lowStockCount,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Out of Stock',
      value: outOfStockCount,
      icon: CircleX,
      color: 'bg-red-50 text-red-600',
    },
  ]

  // Stock status styling
  function statusBadge(stock) {
    if (stock <= 0) {
      return 'bg-red-50 text-red-700'
    }

    if (stock <= LOW_STOCK_LIMIT) {
      return 'bg-amber-50 text-amber-700'
    }

    return 'bg-emerald-50 text-emerald-700'
  }

  // Stock status label
  function statusLabel(stock) {
    if (stock <= 0) return 'Out of Stock'
    if (stock <= LOW_STOCK_LIMIT) return 'Low Stock'
    return 'In Stock'
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor stock levels and manage stock adjustments.
          </p>
        </div>

        <button
          onClick={exportInventory}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowDownToLine size={18} />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon size={23} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or SKU..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All categories</option>

            {productCategories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Stock status filter */}
          <select
            value={stockStatus}
            onChange={(event) => setStockStatus(event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All stock statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Stock Overview
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredProducts.length} product(s) found
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Product
                </th>

                <th className="px-5 py-4 font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 font-semibold">
                  Stock Level
                </th>

                <th className="px-5 py-4 font-semibold">
                  Selling Price
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
                </th>

                {canManageInventory && (
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0)

                const progress = Math.min(
                  (stock / (LOW_STOCK_LIMIT * 3)) * 100,
                  100
                )

                return (
                  <tr
                    key={product.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Product information */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 text-gray-600">
                      {product.category}
                    </td>

                    {/* Stock level */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              stock <= 0
                                ? 'bg-red-500'
                                : stock <= LOW_STOCK_LIMIT
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <span className="font-semibold text-gray-800">
                          {stock} {product.unit || 'units'}
                        </span>
                      </div>

                      {stock <= LOW_STOCK_LIMIT && (
                        <p className="mt-1 text-xs text-amber-600">
                          {stock <= 0
                            ? 'Restock required'
                            : 'Below threshold'}
                        </p>
                      )}
                    </td>

                    {/* Selling price */}
                    <td className="px-5 py-4 font-medium text-gray-700">
                      {formatCurrency(
                        Number(product.sellingPrice || 0)
                      )}
                    </td>

                    {/* Stock status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(stock)}`}
                      >
                        {statusLabel(stock)}
                      </span>
                    </td>

                    {/* Stock adjustment actions */}
                    {canManageInventory && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              openAdjustment(product, 'add')
                            }
                            title="Add stock"
                            aria-label={`Add stock for ${product.name}`}
                            className="rounded-lg border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <Plus size={16} />
                          </button>

                          <button
                            onClick={() =>
                              openAdjustment(product, 'remove')
                            }
                            disabled={stock <= 0}
                            title="Remove stock"
                            aria-label={`Remove stock for ${product.name}`}
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={16} />
                          </button>

                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}

              {/* Empty state */}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageInventory ? 6 : 5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    <Package
                      size={32}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock adjustment modal */}
      {canManageInventory && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            {/* Modal heading */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {adjustmentType === 'add'
                    ? 'Add Stock'
                    : 'Remove Stock'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedProduct.name}
                </p>
              </div>

              <button
                onClick={closeAdjustment}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current stock */}
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Current stock
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {selectedProduct.stock} {selectedProduct.unit || 'units'}
              </p>
            </div>

            {/* Adjustment form */}
            <form
              onSubmit={saveAdjustment}
              className="mt-5 space-y-4"
            >

              {/* Quantity */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Reason
                </label>

                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  {(adjustmentType === 'add'
                    ? [
                        'New stock received',
                        'Customer return',
                        'Stock correction',
                        'Other',
                      ]
                    : [
                        'Damaged goods',
                        'Expired goods',
                        'Stock correction',
                        'Other',
                      ]
                  ).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              {/* Modal actions */}
              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeAdjustment}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`flex-1 rounded-xl px-4 py-2.5 font-semibold text-white ${
                    adjustmentType === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm Adjustment
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
