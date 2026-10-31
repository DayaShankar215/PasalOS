
import { useMemo, useState } from 'react'
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  UserRound,
  Phone,
  Mail,
  X,
  ShieldAlert,
} from 'lucide-react'

import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

export default function Customers() {
  const [customers, setCustomers] = useCustomers()

  const { user } = useAuth()

  // ----------------------------------------
  // Role-Based Permissions
  // ----------------------------------------

  const canViewCustomers = hasPermission(
    user?.role,
    'customers',
    'view'
  )

  const canManageCustomers = hasPermission(
    user?.role,
    'customers',
    'full'
  )

  // ----------------------------------------
  // Component States
  // ----------------------------------------

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ----------------------------------------
  // Search and Filter Customers
  // ----------------------------------------

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    )
  }, [customers, search])

  // ----------------------------------------
  // Add Customer
  // ----------------------------------------

  function openAddForm() {
    if (!canManageCustomers) return

    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setShowForm(true)
  }

  // ----------------------------------------
  // Edit Customer
  // ----------------------------------------

  function openEditForm(customer) {
    if (!canManageCustomers) return

    setEditingId(customer.id)

    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    })

    setError('')
    setShowForm(true)
  }

  // ----------------------------------------
  // Close Customer Form
  // ----------------------------------------

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
  }

  // ----------------------------------------
  // Handle Form Changes
  // ----------------------------------------

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // ----------------------------------------
  // Validate and Save Customer
  // ----------------------------------------

  function handleSubmit(event) {
    event.preventDefault()

    if (!canManageCustomers) return

    const name = form.name.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()
    const address = form.address.trim()

    // Required field validation

    if (!name) {
      setError('Please enter the customer name.')
      return
    }

    if (!phone) {
      setError('Please enter the customer phone number.')
      return
    }

    // Duplicate phone validation

    const duplicatePhone = customers.some(
      (customer) =>
        String(customer.phone || '').trim() === phone &&
        customer.id !== editingId
    )

    if (duplicatePhone) {
      setError('A customer with this phone number already exists.')
      return
    }

    // Duplicate email validation

    const duplicateEmail = email && customers.some(
      (customer) =>
        String(customer.email || '').trim().toLowerCase() ===
          email.toLowerCase() &&
        customer.id !== editingId
    )

    if (duplicateEmail) {
      setError('A customer with this email already exists.')
      return
    }

    // Update existing customer

    if (editingId) {
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === editingId
            ? {
                ...customer,
                name,
                phone,
                email,
                address,
              }
            : customer
        )
      )
    } else {
      // Create new customer

      const newCustomer = {
        id: `CUS-${Date.now()}`,
        name,
        phone,
        email,
        address,
        createdAt: new Date().toISOString(),
      }

      setCustomers((previous) => [
        newCustomer,
        ...previous,
      ])
    }

    closeForm()
  }

  // ----------------------------------------
  // Delete Customer
  // ----------------------------------------

  function deleteCustomer() {
    if (!canManageCustomers || !deleteTarget) return

    setCustomers((previous) =>
      previous.filter(
        (customer) => customer.id !== deleteTarget.id
      )
    )

    setDeleteTarget(null)
  }

  // ----------------------------------------
  // Export Customers to CSV
  // ----------------------------------------

  function exportCSV() {
    if (!canViewCustomers || filteredCustomers.length === 0) return

    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Address',
    ]

    const rows = filteredCustomers.map((customer) => [
      customer.id,
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
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
    link.download = 'pasalos-customers.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // ----------------------------------------
  // Customer Statistics
  // ----------------------------------------

  const stats = [
    {
      label: 'Total Customers',
      value: customers.length,
      icon: Users,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'With Email',
      value: customers.filter(
        (customer) => String(customer.email || '').trim()
      ).length,
      icon: Mail,
      style: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'With Phone',
      value: customers.filter(
        (customer) => String(customer.phone || '').trim()
      ).length,
      icon: Phone,
      style: 'bg-emerald-50 text-emerald-600',
    },
  ]

  // ----------------------------------------
  // Access Restricted
  // ----------------------------------------

  if (!canViewCustomers) {
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
            You do not have permission to view customer records.
            Please contact your shop administrator if you need access.
          </p>
        </div>
      </div>
    )
  }

  // ----------------------------------------
  // Customers Page
  // ----------------------------------------

  return (
    <div className="space-y-6">

      {/* Page Heading */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer contact information in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* Export Button */}

          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredCustomers.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>

          {/* Add Customer Button */}

          {canManageCustomers && (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.style}`}>
                <Icon size={22} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Search Customers */}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, email, or address..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Customer Directory */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Customer Directory
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {filteredCustomers.length} customer(s) found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-187.5 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Address</th>

                {canManageCustomers && (
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <UserRound size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {customer.name || 'Unnamed Customer'}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {customer.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {customer.phone || '—'}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {customer.email || '—'}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {customer.address || '—'}
                  </td>

                  {/* Customer Actions */}

                  {canManageCustomers && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() => openEditForm(customer)}
                          title="Edit customer"
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(customer)}
                          title="Delete customer"
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Empty State */}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageCustomers ? 5 : 4}
                    className="px-5 py-14 text-center"
                  >
                    <Users
                      size={36}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No customers found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {search
                        ? 'Try adjusting your search.'
                        : 'Add a customer to get started.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}

      {canManageCustomers && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? 'Edit Customer' : 'Add Customer'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the customer's contact information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Form */}

            <form onSubmit={handleSubmit} className="space-y-4 p-6">

              {/* Customer Name */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Customer Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone Number */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>

                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={25}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Email Address */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="customer@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Address */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={250}
                  rows={3}
                  placeholder="Enter address"
                  className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Validation Error */}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {/* Form Actions */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingId ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}

      {canManageCustomers && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Delete Customer?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">
                {deleteTarget.name}
              </span>
              ? This removes the customer from your directory.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteCustomer}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
