
import { useMemo, useState } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Receipt,
  CheckCircle2,
  Printer,
  X,
} from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCustomers } from '../hooks/useCustomers'
import { useSales } from '../hooks/useSales'
import { formatCurrency } from '../utils/currency'
import { useStockMovements } from '../hooks/useStockMovements'

const VAT_RATE = 0.13

export default function POS() {
  const [products, setProducts] = useProducts()
  const [sales, setSales] = useSales()
  const [, setMovements] = useStockMovements()
  const [customers] = useCustomers()
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [discountPercent, setDiscountPercent] = useState('0')
  const [applyVat, setApplyVat] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState('')
  const [completedSale, setCompletedSale] = useState(null)
  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === selectedCustomerId
  )

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((product) => {
      const stock = Number(product.stock || 0)

      return (
        stock > 0 &&
        (!term ||
          product.name.toLowerCase().includes(term) ||
          String(product.sku || '').toLowerCase().includes(term))
      )
    })
  }, [products, search])

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const safeDiscount = Math.min(
    100,
    Math.max(0, Number(discountPercent) || 0)
  )

  const discountAmount = subtotal * (safeDiscount / 100)
  const taxableAmount = subtotal - discountAmount
  const vatAmount = applyVat ? taxableAmount * VAT_RATE : 0
  const total = taxableAmount + vatAmount
  const cash = Number(cashReceived) || 0
  const change = cash - total

  function addToCart(product) {
    setError('')
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.productId === product.id
      )

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          setError(`Only ${product.stock} units of ${product.name} are available.`)
          return currentCart
        }

        return currentCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentCart,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || '',
          price: Number(product.sellingPrice) || 0,
          quantity: 1,
        },
      ]
    })
  }

  function changeQuantity(productId, delta) {
    setError('')

    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.productId !== productId) return item

          const product = products.find((p) => p.id === productId)
          const maxStock = Number(product?.stock || 0)
          const nextQuantity = item.quantity + delta

          if (nextQuantity > maxStock) {
            setError(`Only ${maxStock} units are available for ${item.name}.`)
            return item
          }

          return { ...item, quantity: nextQuantity }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    )
  }

  function completeSale(event) {
    event.preventDefault()
    setError('')

    if (cart.length === 0) {
      setError('Add at least one product to the cart.')
      return
    }

    // Re-check stock at checkout time.
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId)

      if (!product || Number(product.stock || 0) < item.quantity) {
        setError(`Insufficient stock for ${item.name}. Please review the cart.`)
        return
      }
    }

    if (cash < total) {
      setError('Cash received must be at least the total amount.')
      return
    }

    const sale = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      customerEmail: selectedCustomer?.email || '',
      items: cart.map((item) => ({ ...item })),
      subtotal,
      discountPercent: safeDiscount,
      discountAmount,
      vatRate: applyVat ? VAT_RATE : 0,
      vatAmount,
      total,
      paymentMethod: 'Cash',
      cashReceived: cash,
      change: Math.max(0, change),
      status: 'Completed',
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const soldItem = cart.find(
          (item) => item.productId === product.id
        )

        return soldItem
          ? {
              ...product,
              stock: Number(product.stock || 0) - soldItem.quantity,
            }
          : product
      })
    )

    setSales((currentSales) => [sale, ...currentSales])
    setCompletedSale(sale)
    setCart([])
    setSearch('')
    setSelectedCustomerId('')
    setDiscountPercent('0')
    setApplyVat(false)
    setCashReceived('')
  }

  function printReceipt() {
    window.print()
  }

  function startNewSale() {
    setCompletedSale(null)
    setError('')
  }

  if (completedSale) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={52} />
          <h1 className="text-2xl font-bold text-gray-900">Sale Completed!</h1>
          <p className="mt-1 text-sm text-gray-500">
            The sale has been recorded and stock has been updated.
          </p>
        </div>

        <div id="pos-receipt" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="border-b border-dashed border-gray-300 pb-4 text-center">
            <h2 className="text-xl font-bold text-gray-900">PasalOS</h2>
            <p className="text-sm text-gray-500">Sales Receipt</p>
            <p className="mt-3 text-sm font-semibold">{completedSale.id}</p>
            <p className="text-xs text-gray-500">
              {new Date(completedSale.date).toLocaleString('en-NP')}
            </p>
          </div>

          <div className="border-b border-dashed border-gray-300 py-4 text-sm">
            <p>
              <span className="text-gray-500">Customer:</span>{' '}
              {completedSale.customerName}
            </p>
          </div>

          <div className="space-y-3 border-b border-dashed border-gray-300 py-4">
            {completedSale.items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(item.quantity * item.price)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 py-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(completedSale.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({completedSale.discountPercent}%)</span>
              <span>-{formatCurrency(completedSale.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({completedSale.vatRate * 100}%)</span>
              <span>{formatCurrency(completedSale.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(completedSale.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash received</span>
              <span>{formatCurrency(completedSale.cashReceived)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>Change</span>
              <span>{formatCurrency(completedSale.change)}</span>
            </div>
          </div>

          <p className="border-t border-dashed border-gray-300 pt-4 text-center text-xs text-gray-500">
            Thank you for shopping with us!
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row no-print">
          <button
            onClick={printReceipt}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer size={18} />
            Print Receipt
          </button>
          <button
            onClick={startNewSale}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New Sale
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select products, manage the cart, and complete a checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Product selection */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">Select Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              Only products with available stock are shown.
            </p>
          </div>

          <div className="relative mb-5">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availableProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <ShoppingCart size={19} />
                  </div>
                  <span className="text-xs text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>
                <p className="mt-3 font-semibold text-gray-900">{product.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  SKU: {product.sku || 'N/A'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-blue-700">
                    {formatCurrency(Number(product.sellingPrice) || 0)}
                  </span>
                  <Plus size={18} className="text-blue-600" />
                </div>
              </button>
            ))}

            {availableProducts.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-gray-500">
                No in-stock products match your search.
              </p>
            )}
          </div>
        </section>

        {/* Cart and checkout */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Current Sale</h2>
              <p className="mt-1 text-sm text-gray-500">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} item(s)
              </p>
            </div>
            <ShoppingCart size={22} className="text-blue-600" />
          </div>

          <div className="max-h-80 space-y-4 overflow-y-auto py-4">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatCurrency(item.price)} each
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQuantity(item.productId, -1)}
                    aria-label={`Decrease ${item.name} quantity`}
                    className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => changeQuantity(item.productId, 1)}
                    aria-label={`Increase ${item.name} quantity`}
                    className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-10 text-center">
                <ShoppingCart
                  size={34}
                  className="mx-auto mb-3 text-gray-300"
                />
                <p className="text-sm font-medium text-gray-600">
                  Your cart is empty
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Select a product to begin.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={completeSale} className="space-y-4 border-t border-gray-100 pt-4">
            <div className="space-y-2">
              <label
                htmlFor="pos-customer"
                className="block text-sm font-medium text-gray-700"
              >
                Select Customer
              </label>

              <select
                id="pos-customer"
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Walk-in Customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={String(customer.id)}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="rounded-xl bg-blue-50 p-3 text-sm">
                  <p className="font-semibold text-blue-900">
                    {selectedCustomer.name}
                  </p>

                  <p className="mt-1 text-blue-700">
                    Phone: {selectedCustomer.phone}
                  </p>

                  {selectedCustomer.email && (
                    <p className="mt-1 text-blue-700">
                      Email: {selectedCustomer.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <span>
                <span className="block text-sm font-medium text-gray-800">
                  Apply VAT (13%)
                </span>
                <span className="text-xs text-gray-500">
                  Applied to subtotal after discount
                </span>
              </span>
              <input
                type="checkbox"
                checked={applyVat}
                onChange={(event) => setApplyVat(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
            </label>

            <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-2">
                  <Banknote size={17} />
                  Cash Received (NPR)
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(event) => setCashReceived(event.target.value)}
                placeholder="Enter amount received"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                required
              />
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Change due</span>
                <span
                  className={`font-semibold ${
                    change < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Receipt size={18} />
              Complete Sale
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
