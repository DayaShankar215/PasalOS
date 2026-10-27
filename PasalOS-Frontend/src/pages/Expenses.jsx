import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Wallet,
  TrendingUp,
  CalendarDays,
  Receipt,
  Download,
  Pencil,
  Trash2,
  X,
  Filter,
  AlertCircle,
} from 'lucide-react'

import { useExpenses } from '../hooks/useExpenses'
import { formatCurrency } from '../utils/currency'

const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Salaries',
  'Transportation',
  'Maintenance',
  'Internet',
  'Packaging',
  'Marketing',
  'Taxes',
  'Other',
]

const EMPTY_FORM = {
  title: '',
  category: 'Other',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Cash',
  notes: '',
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Expenses() {
  const [expenses, setExpenses] = useExpenses()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth())

  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [error, setError] = useState('')

  // Calculate expense summaries.
  const currentMonth = getCurrentMonth()

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  )

  const currentMonthExpenses = expenses
    .filter((expense) => expense.date?.slice(0, 7) === currentMonth)
    .reduce((total, expense) => total + Number(expense.amount || 0), 0)

  const currentMonthCount = expenses.filter(
    (expense) => expense.date?.slice(0, 7) === currentMonth
  ).length

  // Search and filter expenses.
  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase()

    return expenses
      .filter((expense) => {
        const matchesSearch =
          !query ||
          expense.title?.toLowerCase().includes(query) ||
          expense.category?.toLowerCase().includes(query) ||
          expense.notes?.toLowerCase().includes(query) ||
          expense.paymentMethod?.toLowerCase().includes(query)

        const matchesCategory =
          categoryFilter === 'All' ||
          expense.category === categoryFilter

        const matchesMonth =
          !monthFilter || expense.date?.slice(0, 7) === monthFilter

        return matchesSearch && matchesCategory && matchesMonth
      })
      .sort((a, b) => {
        const dateComparison = (b.date || '').localeCompare(a.date || '')

        if (dateComparison !== 0) return dateComparison

        return String(b.createdAt || '').localeCompare(
          String(a.createdAt || '')
        )
      })
  }, [expenses, search, categoryFilter, monthFilter])

  const filteredTotal = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  )

  function updateField(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  function openAddModal() {
    setEditingExpense(null)
    setForm({ ...EMPTY_FORM })
    setError('')
    setShowModal(true)
  }

  function openEditModal(expense) {
    setEditingExpense(expense)

    setForm({
      title: expense.title || '',
      category: expense.category || 'Other',
      amount: String(expense.amount ?? ''),
      date: expense.date || new Date().toISOString().slice(0, 10),
      paymentMethod: expense.paymentMethod || 'Cash',
      notes: expense.notes || '',
    })

    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingExpense(null)
    setError('')
  }

  function saveExpense(event) {
    event.preventDefault()
    setError('')

    const title = form.title.trim()
    const amount = Number(form.amount)

    if (!title) {
      setError('Please enter an expense name.')
      return
    }

    if (
      form.amount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError('Please enter an amount greater than zero.')
      return
    }

    if (!form.date) {
      setError('Please select an expense date.')
      return
    }

    const expenseData = {
      title,
      category: form.category,
      amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
      updatedAt: new Date().toISOString(),
    }

    if (editingExpense) {
      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === editingExpense.id
            ? {
                ...expense,
                ...expenseData,
              }
            : expense
        )
      )
    } else {
      const newExpense = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...expenseData,
        createdAt: new Date().toISOString(),
      }

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ])
    }

    closeModal()
  }

  function deleteExpense(expense) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${expense.title}"?`
    )

    if (!confirmed) return

    setExpenses((currentExpenses) =>
      currentExpenses.filter((item) => item.id !== expense.id)
    )
  }

  function exportCSV() {
    const headers = [
      'Expense Name',
      'Category',
      'Amount (NPR)',
      'Date',
      'Payment Method',
      'Notes',
    ]

    const rows = filteredExpenses.map((expense) => [
      expense.title,
      expense.category,
      expense.amount,
      expense.date,
      expense.paymentMethod,
      expense.notes || '',
    ])

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'pasalos-expenses.csv'

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const summaryCards = [
    {
      title: 'All-Time Expenses',
      value: formatCurrency(totalExpenses),
      description: 'Total recorded expenses',
      icon: Wallet,
      iconStyle: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'This Month',
      value: formatCurrency(currentMonthExpenses),
      description: 'Expenses recorded this month',
      icon: TrendingUp,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Monthly Records',
      value: currentMonthCount,
      description: 'Expenses this month',
      icon: CalendarDays,
      iconStyle: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Filtered Total',
      value: formatCurrency(filteredTotal),
      description: 'Based on your current filters',
      icon: Receipt,
      iconStyle: 'bg-amber-100 text-amber-700',
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track and manage your business expenses in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>

                <div className={`rounded-lg p-3 ${card.iconStyle}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expenses table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Search and filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expenses..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={17} className="text-gray-500" />

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All Categories</option>

                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              aria-label="Filter expenses by month"
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategoryFilter('All')
                setMonthFilter('')
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Expense
                </th>

                <th className="px-5 py-4 font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 font-semibold">
                  Date
                </th>

                <th className="px-5 py-4 font-semibold">
                  Payment
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Amount
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">
                      {expense.title}
                    </p>

                    {expense.notes && (
                      <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                        {expense.notes}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {expense.category}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {formatDate(expense.date)}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {expense.paymentMethod}
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        title="Edit expense"
                        onClick={() => openEditModal(expense)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title="Delete expense"
                        onClick={() => deleteExpense(expense)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-full bg-gray-100 p-4">
                        <Receipt
                          size={28}
                          className="text-gray-400"
                        />
                      </div>

                      <p className="mt-4 font-semibold text-gray-800">
                        No expenses found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Add an expense or adjust your search filters.
                      </p>

                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                      >
                        <Plus size={17} />
                        Add Your First Expense
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-5 py-3 text-sm text-gray-500">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter your business expense details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveExpense} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Expense Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Shop rent"
                  maxLength={120}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    {EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Amount (NPR) <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={updateField}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Expense Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={updateField}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows="3"
                  maxLength={500}
                  placeholder="Add any additional details..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={18} className="shrink-0" />
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
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}