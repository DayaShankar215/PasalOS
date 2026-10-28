import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Package,
  CircleDollarSign,
  AlertTriangle,
  Receipt,
  Boxes,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { formatCurrency } from '../utils/currency'

function getSaleTotal(sale) {
  return Number(sale.total ?? sale.amount ?? 0) || 0
}

function getSaleDate(sale) {
  const date = new Date(sale.date)

  return Number.isNaN(date.getTime()) ? null : date
}

function getCustomerName(sale) {
  if (typeof sale.customer === 'string') {
    return sale.customer || 'Walk-in Customer'
  }

  return (
    sale.customerName ||
    sale.customer?.name ||
    'Walk-in Customer'
  )
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-NP', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function StatCard({ title, value, description, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            colorClasses[color] || colorClasses.blue
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products] = useProducts()
  const [sales] = useSales()

  const safeProducts = Array.isArray(products) ? products : []
  const safeSales = Array.isArray(sales) ? sales : []

  const today = new Date()

  const todaySales = useMemo(() => {
    return safeSales.filter((sale) => {
      const date = getSaleDate(sale)

      return (
        date &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate() &&
        sale.status !== 'Cancelled'
      )
    })
  }, [safeSales, today.toDateString()])

  const totalSalesToday = todaySales.reduce(
    (total, sale) => total + getSaleTotal(sale),
    0
  )

  const inventoryValue = safeProducts.reduce(
    (total, product) =>
      total +
      (Number(product.costPrice) || 0) *
        (Number(product.stock) || 0),
    0
  )

  const lowStockProducts = useMemo(() => {
    return safeProducts.filter(
      (product) => Number(product.stock) <= 10
    ).sort(
      (a, b) =>
        (Number(a.stock) || 0) - (Number(b.stock) || 0)
    )
  }, [safeProducts])

  const recentTransactions = useMemo(() => {
    return [...safeSales]
      .sort((a, b) => {
        const dateA = getSaleDate(a)?.getTime() || 0
        const dateB = getSaleDate(b)?.getTime() || 0

        return dateB - dateA
      })
      .slice(0, 5)
  }, [safeSales])

  const salesChartData = useMemo(() => {
    const days = []

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date()

      date.setDate(date.getDate() - index)
      date.setHours(0, 0, 0, 0)

      days.push({
        date,
        day: date.toLocaleDateString('en-NP', {
          weekday: 'short',
        }),
        sales: 0,
      })
    }

    safeSales.forEach((sale) => {
      if (sale.status === 'Cancelled') {
        return
      }

      const saleDate = getSaleDate(sale)

      if (!saleDate) {
        return
      }

      const matchingDay = days.find(
        (day) =>
          day.date.getFullYear() === saleDate.getFullYear() &&
          day.date.getMonth() === saleDate.getMonth() &&
          day.date.getDate() === saleDate.getDate()
      )

      if (matchingDay) {
        matchingDay.sales += getSaleTotal(sale)
      }
    })

    return days.map(({ day, sales }) => ({
      day,
      sales,
    }))
  }, [safeSales, today.toDateString()])

  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(totalSalesToday),
      description: `${todaySales.length} transaction(s) today`,
      icon: CircleDollarSign,
      color: 'green',
    },
    {
      title: 'Total Products',
      value: safeProducts.length.toLocaleString('en-NP'),
      description: 'Products currently registered',
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(inventoryValue),
      description: 'Based on cost price and current stock',
      icon: Boxes,
      color: 'purple',
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length.toLocaleString('en-NP'),
      description: 'Products with 10 units or fewer',
      icon: AlertTriangle,
      color: 'orange',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Your Business at a Glance
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome back, Admin! 👋
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here's what's happening with your store today.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow-sm">
          <CalendarDays size={18} className="text-blue-600" />

          {formatDate(today)}
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      {/* Sales chart and low stock */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Sales recorded over the last seven days.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `Rs. ${(value / 1000).toFixed(0)}k`
                      : `Rs. ${value}`
                  }
                  width={75}
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Sales',
                  ]}
                  labelFormatter={(label) => `Day: ${label}`}
                />

                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low-stock products */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Low Stock Alert
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products that may need restocking.
              </p>
            </div>

            <AlertTriangle
              size={22}
              className="shrink-0 text-orange-500"
            />
          </div>

          <div className="mt-5 space-y-4">
            {lowStockProducts.slice(0, 5).map((product) => {
              const stock = Number(product.stock) || 0

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {product.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      SKU: {product.sku || 'N/A'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      stock === 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {stock === 0 ? 'Out of stock' : `${stock} left`}
                  </span>
                </div>
              )
            })}

            {lowStockProducts.length === 0 && (
              <div className="py-8 text-center">
                <Package
                  size={32}
                  className="mx-auto mb-2 text-emerald-500"
                />

                <p className="text-sm font-medium text-gray-700">
                  All products are sufficiently stocked.
                </p>
              </div>
            )}
          </div>

          <Link
            to="/inventory"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            View Inventory
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The latest recorded sales.
            </p>
          </div>

          <Link
            to="/sales"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {recentTransactions.map((sale, index) => {
                const completed = sale.status !== 'Pending' &&
                  sale.status !== 'Cancelled'

                return (
                  <tr
                    key={sale.id ?? `${sale.date}-${index}`}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <ShoppingBag size={17} />
                        </div>

                        <span className="font-semibold text-gray-800">
                          {sale.id || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {getCustomerName(sale)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {sale.date ? formatDate(sale.date) : 'N/A'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">
                      {formatCurrency(getSaleTotal(sale))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          completed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {completed ? (
                          <ArrowUpRight size={13} />
                        ) : (
                          <ArrowDownRight size={13} />
                        )}

                        {sale.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Receipt
                      size={34}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No sales recorded yet
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Completed sales will appear here.
                    </p>

                    <Link
                      to="/pos"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Start a Sale
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
} 