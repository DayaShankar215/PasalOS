
const pool = require('../config/db')
const bcrypt = require('bcryptjs')

// ============================================
// HELPER FUNCTIONS
// ============================================

// Validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validate employee ID
const isValidUserId = (id) => {
  return Number.isInteger(Number(id)) && Number(id) > 0
}

// ============================================
// GET: ALL EMPLOYEES
// ============================================

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE shop_id = ?
       AND role IN ('manager', 'cashier')
       ORDER BY created_at DESC`,
      [req.shopId]
    )

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    console.error('Get users error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees.',
    })
  }
}

// ============================================
// GET: SINGLE EMPLOYEE
// ============================================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUserId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID.',
      })
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE id = ?
       AND shop_id = ?
       AND role IN ('manager', 'cashier')
       LIMIT 1`,
      [Number(id), req.shopId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: users[0],
    })
  } catch (error) {
    console.error('Get employee error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee.',
    })
  }
}

// ============================================
// POST: CREATE EMPLOYEE
// ============================================

const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password and role are required.',
      })
    }

    const normalizedName = String(full_name).trim()
    const normalizedEmail = String(email).trim().toLowerCase()

    if (!normalizedName || normalizedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 1 and 150 characters.',
      })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 72 characters.',
      })
    }

    if (!['manager', 'cashier'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be manager or cashier.',
      })
    }

    // Check duplicate email within the same shop
    const [existingUsers] = await pool.execute(
      `SELECT id
       FROM users
       WHERE shop_id = ? AND email = ?
       LIMIT 1`,
      [req.shopId, normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email already exists.',
      })
    }

    // Hash password before saving
    const passwordHash = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO users
       (shop_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.shopId,
        normalizedName,
        normalizedEmail,
        passwordHash,
        role,
      ]
    )

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: {
        id: result.insertId,
        full_name: normalizedName,
        email: normalizedEmail,
        role,
        status: 'active',
      },
    })
  } catch (error) {
    console.error('Create employee error:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create employee.',
    })
  }
}

// ============================================
// PUT: UPDATE EMPLOYEE DETAILS
// ============================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, email, role } = req.body

    if (!isValidUserId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID.',
      })
    }

    if (!full_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and role are required.',
      })
    }

    const normalizedName = String(full_name).trim()
    const normalizedEmail = String(email).trim().toLowerCase()

    if (!normalizedName || normalizedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 1 and 150 characters.',
      })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    if (!['manager', 'cashier'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be manager or cashier.',
      })
    }

    // Verify employee belongs to owner's shop
    const [users] = await pool.execute(
      `SELECT id
       FROM users
       WHERE id = ?
       AND shop_id = ?
       AND role IN ('manager', 'cashier')
       LIMIT 1`,
      [Number(id), req.shopId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    // Check duplicate email
    const [duplicates] = await pool.execute(
      `SELECT id
       FROM users
       WHERE shop_id = ?
       AND email = ?
       AND id != ?
       LIMIT 1`,
      [req.shopId, normalizedEmail, Number(id)]
    )

    if (duplicates.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already used by another user.',
      })
    }

    await pool.execute(
      `UPDATE users
       SET full_name = ?, email = ?, role = ?
       WHERE id = ? AND shop_id = ?`,
      [
        normalizedName,
        normalizedEmail,
        role,
        Number(id),
        req.shopId,
      ]
    )

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
    })
  } catch (error) {
    console.error('Update employee error:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This email is already used by another user.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update employee.',
    })
  }
}

// ============================================
// PATCH: ACTIVATE / DEACTIVATE EMPLOYEE
// ============================================

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!isValidUserId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID.',
      })
    }

    const userId = Number(id)

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or inactive.',
      })
    }

    // Prevent owner from changing their own account status
    if (userId === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status here.',
      })
    }

    const [result] = await pool.execute(
      `UPDATE users
       SET status = ?
       WHERE id = ?
       AND shop_id = ?
       AND role IN ('manager', 'cashier')`,
      [status, userId, req.shopId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    return res.status(200).json({
      success: true,
      message: `Employee ${
        status === 'active' ? 'activated' : 'deactivated'
      } successfully.`,
    })
  } catch (error) {
    console.error('Update employee status error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update employee status.',
    })
  }
}

// ============================================
// PATCH: RESET EMPLOYEE PASSWORD
// ============================================

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params
    const { new_password, confirm_password } = req.body

    if (!isValidUserId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID.',
      })
    }

    const userId = Number(id)

    if (
      typeof new_password !== 'string' ||
      typeof confirm_password !== 'string' ||
      !new_password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation are required.',
      })
    }

    if (new_password.length < 8 || new_password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 72 characters.',
      })
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      })
    }

    // Verify employee belongs to owner's shop
    const [users] = await pool.execute(
      `SELECT id
       FROM users
       WHERE id = ?
       AND shop_id = ?
       AND role IN ('manager', 'cashier')
       LIMIT 1`,
      [userId, req.shopId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    // Hash the new password securely
    const passwordHash = await bcrypt.hash(new_password, 12)

    await pool.execute(
      `UPDATE users
       SET password_hash = ?
       WHERE id = ?
       AND shop_id = ?
       AND role IN ('manager', 'cashier')`,
      [passwordHash, userId, req.shopId]
    )

    return res.status(200).json({
      success: true,
      message: 'Employee password reset successfully.',
    })
  } catch (error) {
    console.error('Reset employee password error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to reset employee password.',
    })
  }
}

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
}
