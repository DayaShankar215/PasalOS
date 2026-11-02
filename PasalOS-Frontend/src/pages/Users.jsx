import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit,
  ShieldCheck,
  UserCog,
  User,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Power,
} from 'lucide-react'

import userService from '../services/userService'
import './Users.css'

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'cashier',
}

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  'Something went wrong. Please try again.'

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="user-stat-card">
      <div className="user-stat-icon">
        <Icon size={21} />
      </div>

      <div>
        <p>{title}</p>
        <h3>{value}</h3>
        <span>{description}</span>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)

  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  })

  const [statusUpdating, setStatusUpdating] = useState(null)

  const showFeedback = (type, message) => {
    setFeedback({ type, message })
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)

    try {
      const response = await userService.getUsers()

      if (!response.success) {
        throw new Error(response.message || 'Unable to load employees.')
      }

      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const activeUsers = users.filter(
    (user) => user.status === 'active'
  ).length

  const inactiveUsers = users.filter(
    (user) => user.status !== 'active'
  ).length

  const managerCount = users.filter(
    (user) => user.role === 'manager'
  ).length

  const cashierCount = users.filter(
    (user) => user.role === 'cashier'
  ).length

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.trim().toLowerCase()

      const matchesSearch =
        !searchValue ||
        user.full_name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue)

      const matchesRole =
        roleFilter === 'all' || user.role === roleFilter

      const matchesStatus =
        statusFilter === 'all' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const openCreateModal = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setShowPassword(false)
    setModalOpen(true)
    setFeedback({ type: '', message: '' })
  }

  const openEditModal = (user) => {
    setEditingUser(user)

    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'cashier',
    })

    setShowPassword(false)
    setModalOpen(true)
    setFeedback({ type: '', message: '' })
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingUser(null)
    setForm(emptyForm)
    setShowPassword(false)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    const full_name = form.full_name.trim()
    const email = form.email.trim().toLowerCase()

    if (!full_name || !email) {
      showFeedback('error', 'Please enter the employee name and email.')
      return
    }

    if (full_name.length > 150) {
      showFeedback('error', 'Name cannot exceed 150 characters.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFeedback('error', 'Please enter a valid email address.')
      return
    }

    if (!editingUser && form.password.length < 8) {
      showFeedback('error', 'Password must contain at least 8 characters.')
      return
    }

    if (!editingUser && form.password.length > 72) {
      showFeedback('error', 'Password cannot exceed 72 characters.')
      return
    }

    const userData = {
      full_name,
      email,
      role: form.role,
    }

    setSaving(true)

    try {
      if (editingUser) {
        const response = await userService.updateUser(
          editingUser.id,
          userData
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to update employee.')
        }

        showFeedback('success', 'Employee updated successfully.')
      } else {
        const response = await userService.createUser({
          ...userData,
          password: form.password,
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to create employee.')
        }

        showFeedback('success', 'Employee created successfully.')
      }

      await fetchUsers()

      setModalOpen(false)
      setEditingUser(null)
      setForm(emptyForm)
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (user) => {
    const nextStatus =
      user.status === 'active' ? 'inactive' : 'active'

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus === 'active' ? 'activate' : 'deactivate'
      } ${user.full_name}?`
    )

    if (!confirmed) return

    setStatusUpdating(user.id)
    setFeedback({ type: '', message: '' })

    try {
      const response = await userService.updateUserStatus(
        user.id,
        nextStatus
      )

      if (!response.success) {
        throw new Error(response.message || 'Failed to update status.')
      }

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? { ...item, status: nextStatus }
            : item
        )
      )

      showFeedback('success', response.message)
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setStatusUpdating(null)
    }
  }

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <div className="users-breadcrumb">
            Workspace / User Management
          </div>

          <h1>User Management</h1>

          <p>
            Manage your shop employees, roles and account access.
          </p>
        </div>

        <div className="users-header-actions">
          <button
            type="button"
            className="users-refresh-button"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            className="users-primary-button"
            onClick={openCreateModal}
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`users-feedback users-feedback-${feedback.type}`}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{feedback.message}</span>

          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="users-stats-grid">
        <StatCard
          title="Total Employees"
          value={users.length}
          icon={UsersIcon}
          description="All shop employees"
        />

        <StatCard
          title="Active Employees"
          value={activeUsers}
          icon={ShieldCheck}
          description="Accounts currently active"
        />

        <StatCard
          title="Managers"
          value={managerCount}
          icon={UserCog}
          description="Employees with manager access"
        />

        <StatCard
          title="Cashiers"
          value={cashierCount}
          icon={User}
          description={`${inactiveUsers} inactive employee(s)`}
        />
      </div>

      <section className="users-content-card">
        <div className="users-content-heading">
          <div>
            <h2>Employees</h2>
            <p>Manage and monitor your employee accounts.</p>
          </div>

          <span className="users-total-label">
            {filteredUsers.length} employees
          </span>
        </div>

        <div className="users-filters">
          <div className="users-search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th className="users-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="users-empty-state">
                    <RefreshCw className="users-loading-icon" size={23} />
                    <span>Loading employees...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="users-empty-state">
                    <UsersIcon size={30} />
                    <strong>No employees found</strong>
                    <span>
                      Try changing your filters or add a new employee.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-employee-cell">
                        <div className="users-avatar">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div>
                          <strong>{user.full_name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`users-role users-role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-status ${
                          user.status === 'active'
                            ? 'users-status-active'
                            : 'users-status-inactive'
                        }`}
                      >
                        <span />
                        {user.status || 'Unknown'}
                      </span>
                    </td>

                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <div className="users-row-actions">
                        <button
                          type="button"
                          className="users-action-edit"
                          title="Edit employee"
                          aria-label={`Edit ${user.full_name}`}
                          onClick={() => openEditModal(user)}
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          className={
                            user.status === 'active'
                              ? 'users-action-deactivate'
                              : 'users-action-activate'
                          }
                          title={
                            user.status === 'active'
                              ? 'Deactivate employee'
                              : 'Activate employee'
                          }
                          aria-label={
                            user.status === 'active'
                              ? `Deactivate ${user.full_name}`
                              : `Activate ${user.full_name}`
                          }
                          disabled={statusUpdating === user.id}
                          onClick={() => handleStatusChange(user)}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="users-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-modal-title"
          >
            <div className="users-modal-header">
              <div>
                <h2 id="users-modal-title">
                  {editingUser ? 'Edit Employee' : 'Add New Employee'}
                </h2>

                <p>
                  {editingUser
                    ? 'Update employee information and access role.'
                    : 'Create an employee account for your shop.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="users-form-group">
                <label htmlFor="employee-name">Full Name</label>

                <input
                  id="employee-name"
                  name="full_name"
                  type="text"
                  placeholder="Enter employee name"
                  value={form.full_name}
                  onChange={handleInputChange}
                  maxLength={150}
                  required
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="employee-email">Email Address</label>

                <input
                  id="employee-email"
                  name="email"
                  type="email"
                  placeholder="employee@example.com"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!editingUser && (
                <div className="users-form-group">
                  <label htmlFor="employee-password">Password</label>

                  <div className="users-password-field">
                    <input
                      id="employee-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={handleInputChange}
                      minLength={8}
                      maxLength={72}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <small>
                    The employee can use this password to log in.
                  </small>
                </div>
              )}

              <div className="users-form-group">
                <label htmlFor="employee-role">Employee Role</label>

                <select
                  id="employee-role"
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="users-role-information">
                <ShieldCheck size={18} />

                <div>
                  <strong>
                    {form.role === 'manager' ? 'Manager Access' : 'Cashier Access'}
                  </strong>

                  <p>
                    {form.role === 'manager'
                      ? 'Managers can access most business modules but cannot manage employees or shop settings.'
                      : 'Cashiers can access the POS and permitted sales-related modules.'}
                  </p>
                </div>
              </div>

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingUser
                      ? 'Save Changes'
                      : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}