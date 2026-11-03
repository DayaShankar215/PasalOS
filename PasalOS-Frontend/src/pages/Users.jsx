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
  KeyRound,
} from 'lucide-react'

import userService from '../services/userService'
import './Users.css'

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'cashier',
}

const emptyPasswordForm = {
  new_password: '',
  confirm_password: '',
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

  // Create and edit employee modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)

  // Reset employee password modal
  const [passwordUser, setPasswordUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)

  // Feedback and status
  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  })
  const [statusUpdating, setStatusUpdating] = useState(null)

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message })
  }, [])

  // Fetch employees
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
  }, [showFeedback])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Employee statistics
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

  // Search and filters
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

  // Open create employee modal
  const openCreateModal = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setShowPassword(false)
    setModalOpen(true)
    setFeedback({ type: '', message: '' })
  }

  // Open edit employee modal
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

  // Close create/edit modal
  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingUser(null)
    setForm(emptyForm)
    setShowPassword(false)
  }

  // Handle create/edit form inputs
  const handleInputChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Create or update employee
  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    const full_name = form.full_name.trim()
    const email = form.email.trim().toLowerCase()

    if (!full_name || !email) {
      showFeedback(
        'error',
        'Please enter the employee name and email.'
      )
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
      showFeedback(
        'error',
        'Password must contain at least 8 characters.'
      )
      return
    }

    if (!editingUser && form.password.length > 72) {
      showFeedback(
        'error',
        'Password cannot exceed 72 characters.'
      )
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
          throw new Error(
            response.message || 'Failed to update employee.'
          )
        }

        showFeedback('success', 'Employee updated successfully.')
      } else {
        const response = await userService.createUser({
          ...userData,
          password: form.password,
        })

        if (!response.success) {
          throw new Error(
            response.message || 'Failed to create employee.'
          )
        }

        showFeedback('success', 'Employee created successfully.')
      }

      await fetchUsers()

      setModalOpen(false)
      setEditingUser(null)
      setForm(emptyForm)
      setShowPassword(false)
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // Activate or deactivate employee
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
        throw new Error(
          response.message || 'Failed to update status.'
        )
      }

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? { ...item, status: nextStatus }
            : item
        )
      )

      showFeedback(
        'success',
        response.message || 'Employee status updated successfully.'
      )
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setStatusUpdating(null)
    }
  }

  // Open password reset modal
  const openPasswordModal = (user) => {
    setPasswordUser(user)
    setPasswordForm(emptyPasswordForm)
    setShowResetPassword(false)
    setFeedback({ type: '', message: '' })
  }

  // Close password reset modal
  // This function can also close the modal after a successful request.
  const closePasswordModal = (force = false) => {
    if (resetSaving && !force) return

    setPasswordUser(null)
    setPasswordForm(emptyPasswordForm)
    setShowResetPassword(false)
  }

  // Handle password form input
  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Reset employee password
  const handlePasswordReset = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    if (!passwordUser) return

    const { new_password, confirm_password } = passwordForm

    if (new_password.length < 8 || new_password.length > 72) {
      showFeedback(
        'error',
        'Password must contain between 8 and 72 characters.'
      )
      return
    }

    if (new_password !== confirm_password) {
      showFeedback('error', 'Passwords do not match.')
      return
    }

    setResetSaving(true)

    try {
      const response = await userService.resetUserPassword(
        passwordUser.id,
        {
          new_password,
          confirm_password,
        }
      )

      if (!response.success) {
        throw new Error(
          response.message || 'Password reset failed.'
        )
      }

      const employeeName = passwordUser.full_name

      // Force-close because resetSaving is still true here.
      closePasswordModal(true)

      showFeedback(
        'success',
        response.message ||
          `Password reset successfully for ${employeeName}.`
      )
    } catch (error) {
      showFeedback('error', getErrorMessage(error))
    } finally {
      setResetSaving(false)
    }
  }

  return (
    <div className="users-page">
      {/* Page header */}
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

      {/* Feedback message */}
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

      {/* Statistics */}
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

      {/* Employee table */}
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

        {/* Search and filters */}
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

        {/* Table */}
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
                    <RefreshCw
                      className="users-loading-icon"
                      size={23}
                    />
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
                      <span
                        className={`users-role users-role-${user.role}`}
                      >
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
                        {/* Edit employee */}
                        <button
                          type="button"
                          className="users-action-edit"
                          title="Edit employee"
                          aria-label={`Edit ${user.full_name}`}
                          onClick={() => openEditModal(user)}
                        >
                          <Edit size={16} />
                        </button>

                        {/* Reset password */}
                        <button
                          type="button"
                          className="users-action-password"
                          title="Reset employee password"
                          aria-label={`Reset password for ${user.full_name}`}
                          onClick={() => openPasswordModal(user)}
                        >
                          <KeyRound size={16} />
                        </button>

                        {/* Activate or deactivate */}
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

      {/* Create / Edit employee modal */}
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
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
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
                    {form.role === 'manager'
                      ? 'Manager Access'
                      : 'Cashier Access'}
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

      {/* Reset password modal */}
      {passwordUser && (
        <div
          className="users-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordModal()
            }
          }}
        >
          <div
            className="users-modal users-password-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
          >
            <div className="users-modal-header">
              <div>
                <h2 id="reset-password-title">Reset Password</h2>
                <p>Set a new password for this employee account.</p>
              </div>

              <button
                type="button"
                onClick={() => closePasswordModal()}
                disabled={resetSaving}
                aria-label="Close password reset modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset}>
              <div className="users-password-user">
                <div className="users-avatar">
                  {passwordUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div>
                  <strong>{passwordUser.full_name}</strong>
                  <span>{passwordUser.email}</span>
                </div>
              </div>

              <div className="users-form-group">
                <label htmlFor="reset-new-password">
                  New Password
                </label>

                <div className="users-password-field">
                  <input
                    id="reset-new-password"
                    name="new_password"
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordInputChange}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowResetPassword((value) => !value)
                    }
                    aria-label={
                      showResetPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showResetPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <small>
                  Password must contain between 8 and 72 characters.
                </small>
              </div>

              <div className="users-form-group">
                <label htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>

                <input
                  id="reset-confirm-password"
                  name="confirm_password"
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordInputChange}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="users-password-warning">
                <KeyRound size={18} />

                <p>
                  The employee will need to use this new password the next
                  time they log in. Make sure to share it with them securely.
                </p>
              </div>

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={() => closePasswordModal()}
                  disabled={resetSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-primary-button"
                  disabled={resetSaving}
                >
                  {resetSaving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="users-loading-icon"
                      />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}