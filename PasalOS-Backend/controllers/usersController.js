
const pool = require('../config/db')
const bcrypt = require('bcryptjs')

// GET: All employees in the logged-in owner's shop
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE shop_id = ? AND role IN ('manager', 'cashier')
       ORDER BY created_at DESC`,
      [req.shopId]
    )

    res.json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees.',
    })
  }
}

// GET: Single employee
const getUserById = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE id = ? AND shop_id = ?
       AND role IN ('manager', 'cashier')
       LIMIT 1`,
      [req.params.id, req.shopId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    res.json({ success: true, data: users[0] })
  } catch (error) {
    console.error('Get employee error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee.',
    })
  }
}

// POST: Create employee
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password and role are required.',
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedName = String(full_name).trim()

    if (!normalizedName || normalizedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 1 and 150 characters.',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
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

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE shop_id = ? AND email = ? LIMIT 1',
      [req.shopId, normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email already exists.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO users (shop_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [req.shopId, normalizedName, normalizedEmail, passwordHash, role]
    )

    res.status(201).json({
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

    res.status(500).json({
      success: false,
      message: 'Failed to create employee.',
    })
  }
}

// PUT: Update employee details
const updateUser = async (req, res) => {
  try {
    const { full_name, email, role } = req.body
    const userId = req.params.id

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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

    const [users] = await pool.execute(
      `SELECT id FROM users
       WHERE id = ? AND shop_id = ?
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

    const [duplicates] = await pool.execute(
      `SELECT id FROM users
       WHERE shop_id = ? AND email = ? AND id != ?
       LIMIT 1`,
      [req.shopId, normalizedEmail, userId]
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
      [normalizedName, normalizedEmail, role, userId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Employee updated successfully.',
    })
  } catch (error) {
    console.error('Update employee error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update employee.',
    })
  }
}

// PATCH: Deactivate or reactivate employee
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body
    const userId = Number(req.params.id)

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or inactive.',
      })
    }

    if (userId === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status here.',
      })
    }

    const [result] = await pool.execute(
      `UPDATE users
       SET status = ?
       WHERE id = ? AND shop_id = ?
       AND role IN ('manager', 'cashier')`,
      [status, userId, req.shopId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      })
    }

    res.json({
      success: true,
      message: `Employee ${status === 'active' ? 'activated' : 'deactivated'} successfully.`,
    })
  } catch (error) {
    console.error('Update employee status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update employee status.',
    })
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
}
