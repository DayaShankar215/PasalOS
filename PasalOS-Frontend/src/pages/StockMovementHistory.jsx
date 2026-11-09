
import { useMemo, useState } from 'react'
import {
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Package,
  RefreshCw,
} from 'lucide-react'

import { useStockMovements } from '../hooks/useStockMovements'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

export default function StockMovementHistory() {
  // Authentication and permission check
  const { user } = useAuth()

  const canViewStockHistory = hasPermission(
    user?.role,
    'stockHistory',
    'view'
  )

  // Database-backed movement history
  const {
    movements,
    loading,
    error,
    refreshMovements,
  } = useStockMovements()

  // Filter states
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')

  // Convert database movement type to readable label
  function movementLabel(type) {
    if (type === 'stock_added') return 'Stock Added'
    if (type === 'stock_removed') return 'Stock Removed'
    if (type === 'adjustment') return 'Adjustment'

    return 'Unknown'
  }

  // Convert MySQL datetime to JavaScript Date
  function parseMovementDate(value) {
    if (!value) return null

    const date = new Date(
      String(value).replace(' ', 'T')
    )

    return Number.isNaN(date.getTime()) ? null : date
  }

  // Filter stock movement records
  const filteredMovements = useMemo(() => {
    const now = new Date()

    return movements.filter((movement) => {
      const searchText = search.toLowerCase()

      const matchesSearch = [
        movement.product_name,
        movement.product_sku,
        movement.reason,
      ].some((value) =>
        String(value || '').toLowerCase().includes(searchText)
      )

      const matchesType =
        typeFilter === 'All' ||
        movementLabel(movement.movement_type) === typeFilter

      const movementDate = parseMovementDate(
        movement.movement_date
      )

      let matchesDate = true

      if (dateFilter !== 'All') {
        if (!movementDate) {
          matchesDate = false
        } else if (dateFilter === 'Today') {
          matchesDate =
            movementDate.toDateString() === now.toDateString()
        } else if (dateFilter === '7 days') {
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(now.getDate() - 7)

          matchesDate =
            movementDate >= sevenDaysAgo &&
            movementDate <= now
        } else if (dateFilter === '30 days') {
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(now.getDate() - 30)

          matchesDate =
            movementDate >= thirtyDaysAgo &&
            movementDate <= now
        }
      }

      return matchesSearch && matchesType && matchesDate
    })
  }, [movements, search, typeFilter, dateFilter])

  // Calculate total stock added
  const totalAdded = movements
    .filter((item) => item.movement_type === 'stock_added')
    .reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    )

  // Calculate total stock removed
  const totalRemoved = movements
    .filter((item) => item.movement_type === 'stock_removed')
    .reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    )

  // Format date and time
  function formatDate(value) {
    const date = parseMovementDate(value)

    if (!date) return 'Invalid date'

    return new Intl.DateTimeFormat('en-NP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  // Prevent unauthorized users from viewing this page
  if (!canViewStockHistory) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <History
            size={40}
            className="mx-auto mb-4 text-gray-400"
          />

          <h2 className="text-xl font-bold text-gray-900">
            Access Restricted
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You do not have permission to view stock movement history.
            Please contact your shop owner.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <History size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stock Movement History
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review stock additions and removals.
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refreshMovements().catch(() => {})}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Total movements */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Total Movements
            </p>

            <ClipboardList
              className="text-blue-600"
              size={22}
            />
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {movements.length}
          </p>
        </div>

        {/* Units added */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Units Added
            </p>

            <ArrowDownLeft
              className="text-emerald-600"
              size={22}
            />
          </div>

          <p className="mt-3 text-2xl font-bold text-emerald-700">
            {totalAdded.toLocaleString()}
          </p>
        </div>

        {/* Units removed */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Units Removed
            </p>

            <ArrowUpRight
              className="text-red-600"
              size={22}
            />
          </div>

          <p className="mt-3 text-2xl font-bold text-red-700">
            {totalRemoved.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and filters */}
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
              placeholder="Search product, SKU, or reason..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Movement type filter */}
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All movement types</option>
            <option value="Stock Added">Stock Added</option>
            <option value="Stock Removed">Stock Removed</option>
            <option value="Adjustment">Adjustment</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All dates</option>
            <option value="Today">Today</option>
            <option value="7 days">Last 7 days</option>
            <option value="30 days">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            onClick={() => refreshMovements().catch(() => {})}
            className="shrink-0 text-sm font-semibold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* History table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Movement Records
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Showing {filteredMovements.length} of {movements.length} records
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-gray-500">
            <RefreshCw
              size={25}
              className="mx-auto mb-3 animate-spin text-blue-500"
            />
            Loading stock movements...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Date & Time
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Product
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Movement
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Quantity
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Stock Change
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Reason
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredMovements.map((movement) => {
                  const type = movement.movement_type
                  const added = type === 'stock_added'
                  const removed = type === 'stock_removed'

                  const badgeStyle = added
                    ? 'bg-emerald-50 text-emerald-700'
                    : removed
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'

                  return (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* Date and time */}
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(movement.movement_date)}
                      </td>

                      {/* Product information */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                            <Package size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {movement.product_name || 'Unknown Product'}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              SKU: {movement.product_sku || 'N/A'}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* Movement type */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}
                        >
                          {added ? (
                            <ArrowDownLeft size={14} />
                          ) : removed ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <RefreshCw size={14} />
                          )}

                          {movementLabel(type)}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {added ? '+' : removed ? '-' : ''}
                        {Number(movement.quantity || 0).toLocaleString()}
                      </td>

                      {/* Previous and new stock */}
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {Number(movement.previous_stock || 0).toLocaleString()}
                        {' → '}
                        {Number(movement.new_stock || 0).toLocaleString()}
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 text-gray-600">
                        {movement.reason || 'Not specified'}
                      </td>

                    </tr>
                  )
                })}

                {/* Empty state */}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center"
                    >
                      <History
                        size={34}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-medium text-gray-700">
                        No stock movements found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Adjust stock from the Inventory page to create your first record.
                      </p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
