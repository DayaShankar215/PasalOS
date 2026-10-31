
import { useMemo, useState } from 'react'
import {
  Search,
  Receipt,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Eye,
  Printer,
  Download,
  X,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react'

import { useSales } from '../hooks/useSales'
import { formatCurrency } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

export default function Sales() {
  const [sales] = useSales()

  const { user } = useAuth()

  const canViewSales = hasPermission(
    user?.role,
    'sales',
    'view'
  )

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedSale, setSelectedSale] = useState(null)

  // ----------------------------------------
  // Access Control
  // ----------------------------------------

  if (!canViewSales) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert size={28} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Access Restricted
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to view sales records.
            Please contact your shop administrator if you need access.
          </p>
        </div>
      </div>
    )
  }

  // ----------------------------------------
  // Sales Summary
  // ----------------------------------------

  const today = new Date().toDateString()

  const todaySales = sales.filter(
    (sale) => new Date(sale.date).toDateString() === today
  )

  const todayRevenue = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  )

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  )

  const averageSale = sales.length
    ? totalRevenue / sales.length
    : 0

  // ----------------------------------------
  // Search and Filters
  // ----------------------------------------

  const filteredSales = useMemo(() => {
    const now = new Date()

    return sales.filter((sale) => {
      const term = search.trim().toLowerCase()

      const matchesSearch = [
        sale.id,
        sale.customerName,
        sale.paymentMethod,
      ].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )

      const matchesStatus =
        statusFilter === 'All' || sale.status === statusFilter

      const saleDate = new Date(sale.date)

      let matchesDate = true

      if (dateFilter === 'Today') {
        matchesDate =
          saleDate.toDateString() === now.toDateString()
      } else if (dateFilter === '7 days') {
        const start = new Date(now)
        start.setDate(now.getDate() - 7)

        matchesDate = saleDate >= start && saleDate <= now
      } else if (dateFilter === '30 days') {
        const start = new Date(now)
        start.setDate(now.getDate() - 30)

        matchesDate = saleDate >= start && saleDate <= now
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [sales, search, dateFilter, statusFilter])

  // ----------------------------------------
  // Date Formatting
  // ----------------------------------------

  function formatDate(value) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date'
    }

    return new Intl.DateTimeFormat('en-NP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  // ----------------------------------------
  // CSV Export
  // ----------------------------------------

  function exportCSV() {
    if (!canViewSales || filteredSales.length === 0) return

    const headers = [
      'Invoice',
      'Date',
      'Customer',
      'Items',
      'Subtotal',
      'Discount',
      'VAT',
      'Total',
      'Payment Method',
      'Status',
    ]

    const rows = filteredSales.map((sale) => [
      sale.id,
      formatDate(sale.date),
      sale.customerName || 'Walk-in Customer',
      (sale.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
      sale.subtotal,
      sale.discountAmount,
      sale.vatAmount,
      sale.total,
      sale.paymentMethod || 'Cash',
      sale.status || 'Completed',
    ])

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
    link.download = 'pasalos-sales.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // ----------------------------------------
  // Invoice Printing
  // ----------------------------------------

  function printInvoice() {
    if (!selectedSale) return
    window.print()
  }

  // ----------------------------------------
  // Summary Cards
  // ----------------------------------------

  const summaryCards = [
    {
      label: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      detail: `${todaySales.length} sale(s) today`,
      icon: TrendingUp,
      iconStyle: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      detail: 'Across recorded sales',
      icon: Wallet,
      iconStyle: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Transactions',
      value: sales.length.toLocaleString(),
      detail: 'All recorded invoices',
      icon: Receipt,
      iconStyle: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Average Sale',
      value: formatCurrency(averageSale),
      detail: 'Average per transaction',
      icon: ShoppingBag,
      iconStyle: 'bg-amber-50 text-amber-600',
    },
  ]

  // ----------------------------------------
  // Invoice Details
  // ----------------------------------------

  if (selectedSale) {
    const itemCount = (selectedSale.items || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    )

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Invoice Header */}

        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review this completed transaction.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={printInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Printer size={17} />
              Print
            </button>

            <button
              type="button"
              onClick={() => setSelectedSale(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <X size={17} />
              Close
            </button>
          </div>
        </div>

        {/* Invoice */}

        <div
          id="sales-invoice"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Invoice Information */}

          <div className="flex flex-col gap-4 border-b border-dashed border-gray-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                PasalOS
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Sales Invoice
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-lg font-bold text-gray-900">
                {selectedSale.id}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {formatDate(selectedSale.date)}
              </p>

              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {selectedSale.status || 'Completed'}
              </span>
            </div>
          </div>

          {/* Customer and Payment Information */}

          <div className="grid grid-cols-1 gap-4 border-b border-dashed border-gray-300 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedSale.customerName || 'Walk-in Customer'}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment Method
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedSale.paymentMethod || 'Cash'}
              </p>
            </div>
          </div>

          {/* Product Items */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-100 text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-4 pr-3">Product</th>
                  <th className="px-3 py-4 text-right">Qty</th>
                  <th className="px-3 py-4 text-right">Price</th>
                  <th className="py-4 pl-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {(selectedSale.items || []).map((item, index) => (
                  <tr key={item.productId || index}>
                    <td className="py-4 pr-3 font-medium text-gray-900">
                      {item.name || 'Product'}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {item.quantity}
                    </td>

                    <td className="px-3 py-4 text-right">
                      {formatCurrency(Number(item.price) || 0)}
                    </td>

                    <td className="py-4 pl-3 text-right font-medium">
                      {formatCurrency(
                        (Number(item.price) || 0) *
                        (Number(item.quantity) || 0)
                      )}
                    </td>
                  </tr>
                ))}

                {(selectedSale.items || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-gray-500"
                    >
                      No product items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}

          <div className="ml-auto mt-5 max-w-sm space-y-3 border-t border-dashed border-gray-300 pt-5 text-sm">
            <div className="flex justify-between gap-4 text-gray-600">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>

            <div className="flex justify-between gap-4 text-gray-600">
              <span>Subtotal</span>
              <span>
                {formatCurrency(Number(selectedSale.subtotal) || 0)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-gray-600">
              <span>Discount</span>
              <span>
                -{formatCurrency(Number(selectedSale.discountAmount) || 0)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-gray-600">
              <span>VAT</span>
              <span>
                {formatCurrency(Number(selectedSale.vatAmount) || 0)}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>
                {formatCurrency(Number(selectedSale.total) || 0)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-gray-600">
              <span>Cash received</span>
              <span>
                {formatCurrency(Number(selectedSale.cashReceived) || 0)}
              </span>
            </div>

            <div className="flex justify-between gap-4 font-semibold text-emerald-700">
              <span>Change</span>
              <span>
                {formatCurrency(Number(selectedSale.change) || 0)}
              </span>
            </div>
          </div>

          <p className="mt-8 border-t border-dashed border-gray-300 pt-5 text-center text-xs text-gray-500">
            Thank you for shopping with us!
          </p>
        </div>
      </div>
    )
  }

  // ----------------------------------------
  // Sales Management Page
  // ----------------------------------------

  return (
    <div className="space-y-6">
      {/* Page Heading */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sales Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track transactions and review completed invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={filteredSales.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>

                  <p className="mt-2 wrap-break-word text-xl font-bold text-gray-900">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {card.detail}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}
                >
                  <Icon size={22} />
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
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice or customer..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Date Filter */}

          <div className="relative">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All dates</option>
              <option value="Today">Today</option>
              <option value="7 days">Last 7 days</option>
              <option value="30 days">Last 30 days</option>
            </select>
          </div>

          {/* Status Filter */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Transactions Table */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Sales Transactions
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {filteredSales.length} transaction(s) found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => {
                const itemCount = (sale.items || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0
                )

                return (
                  <tr
                    key={sale.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700">
                      {sale.id}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {formatDate(sale.date)}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {sale.customerName || 'Walk-in Customer'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {itemCount}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {sale.paymentMethod || 'Cash'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                      {formatCurrency(Number(sale.total) || 0)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sale.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sale.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {sale.status || 'Completed'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        title="View invoice"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}

              {/* Empty State */}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Receipt
                      size={36}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No sales transactions found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Complete a sale from POS to see it listed here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Styles */}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #sales-invoice,
          #sales-invoice * {
            visibility: visible;
          }

          #sales-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            border: none;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
