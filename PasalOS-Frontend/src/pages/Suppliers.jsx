
import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Truck,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Download,
  ShieldAlert,
} from 'lucide-react'
import { useSuppliers } from '../hooks/useSuppliers'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

const emptyForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useSuppliers()
  const { user } = useAuth()

  const canViewSuppliers = hasPermission(user?.role, 'suppliers', 'view')
  const canManageSuppliers = hasPermission(user?.role, 'suppliers', 'full')

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return suppliers

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.company,
        supplier.phone,
        supplier.email,
        supplier.address,
      ].some((value) => String(value || '').toLowerCase().includes(query)),
    )
  }, [suppliers, search])

  const openAddForm = () => {
    if (!canManageSuppliers) return

    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEditForm = (supplier) => {
    if (!canManageSuppliers) return

    setForm({
      name: supplier.name || '',
      company: supplier.company || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    })

    setEditingId(supplier.id)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canManageSuppliers) return

    setError('')

    const name = form.name.trim()
    const company = form.company.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()
    const address = form.address.trim()

    if (!name || !phone) {
      setError('Supplier name and phone number are required.')
      return
    }

    const duplicatePhone = suppliers.some(
      (supplier) =>
        String(supplier.phone || '').trim().toLowerCase() ===
          phone.toLowerCase() &&
        supplier.id !== editingId,
    )

    if (duplicatePhone) {
      setError('A supplier with this phone number already exists.')
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (editingId !== null) {
      setSuppliers((previous) =>
        previous.map((supplier) =>
          supplier.id === editingId
            ? {
                ...supplier,
                name,
                company,
                phone,
                email,
                address,
                updatedAt: new Date().toISOString(),
              }
            : supplier,
        ),
      )
    } else {
      const newSupplier = {
        id: `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        company,
        phone,
        email,
        address,
        createdAt: new Date().toISOString(),
      }

      setSuppliers((previous) => [newSupplier, ...previous])
    }

    closeForm()
  }

  const confirmDelete = () => {
    if (!canManageSuppliers || deleteId === null) return

    setSuppliers((previous) =>
      previous.filter((supplier) => supplier.id !== deleteId),
    )

    setDeleteId(null)
  }

  const exportCSV = () => {
    if (!canManageSuppliers || filteredSuppliers.length === 0) return

    const headers = [
      'Supplier Name',
      'Company',
      'Phone',
      'Email',
      'Address',
    ]

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const rows = filteredSuppliers.map((supplier) =>
      [
        supplier.name,
        supplier.company,
        supplier.phone,
        supplier.email,
        supplier.address,
      ]
        .map(escapeCSV)
        .join(','),
    )

    const csv = [headers.map(escapeCSV).join(','), ...rows].join('\r\n')

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'pasalos-suppliers.csv'

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

  const totalSuppliers = suppliers.length
  const withEmail = suppliers.filter((supplier) => supplier.email).length
  const withCompany = suppliers.filter((supplier) => supplier.company).length

  // Restrict access for unauthorized roles.
  if (!canViewSuppliers) {
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
            You do not have permission to access the Suppliers module.
            Please contact your shop owner if you need access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Suppliers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the businesses and people who supply your products.
          </p>
        </div>

        {canManageSuppliers && (
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Suppliers"
          value={totalSuppliers}
          icon={<Truck size={21} />}
          color="blue"
        />

        <SummaryCard
          title="With Company Details"
          value={withCompany}
          icon={<Building2 size={21} />}
          color="purple"
        />

        <SummaryCard
          title="With Email Address"
          value={withEmail}
          icon={<Mail size={21} />}
          color="green"
        />
      </div>

      {/* Suppliers table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Supplier Directory
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length === 1 ? '' : 's'} found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search suppliers..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            {canManageSuppliers && (
              <button
                type="button"
                onClick={exportCSV}
                disabled={filteredSuppliers.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Address</th>

                {canManageSuppliers && (
                  <th className="px-6 py-4 text-right">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-700">
                        {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>

                      <span className="font-medium text-gray-900">
                        {supplier.name || '—'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {supplier.company || '—'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={15} className="shrink-0 text-gray-400" />
                      {supplier.phone || '—'}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={15} className="shrink-0 text-gray-400" />
                      <span>{supplier.email || '—'}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex max-w-48 items-center gap-2 text-sm text-gray-600">
                      <MapPin size={15} className="shrink-0 text-gray-400" />
                      <span className="truncate">
                        {supplier.address || '—'}
                      </span>
                    </div>
                  </td>

                  {canManageSuppliers && (
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(supplier)}
                          title="Edit supplier"
                          aria-label={`Edit ${supplier.name || 'supplier'}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(supplier.id)}
                          title="Delete supplier"
                          aria-label={`Delete ${supplier.name || 'supplier'}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageSuppliers ? 6 : 5}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Users size={26} />
                    </div>

                    <h3 className="mt-4 font-semibold text-gray-900">
                      {search ? 'No suppliers found' : 'No suppliers yet'}
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                      {search
                        ? 'Try a different search term.'
                        : 'Add your first supplier to start building your supplier directory.'}
                    </p>

                    {!search && canManageSuppliers && (
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus size={17} />
                        Add Your First Supplier
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {canManageSuppliers && showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId !== null ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the supplier's contact information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Supplier Name *">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Ram Sharma"
                    className={inputClass}
                    required
                    autoFocus
                  />
                </FormField>

                <FormField label="Company Name">
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="e.g. Kathmandu Wholesale"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Phone Number *">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. 98XXXXXXXX"
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="Email Address">
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="supplier@example.com"
                    className={inputClass}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Address">
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter supplier address"
                      rows={3}
                      className={`${inputClass} resize-y`}
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingId !== null ? 'Save Changes' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {canManageSuppliers && deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Delete Supplier?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete this supplier? This action
              cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}
