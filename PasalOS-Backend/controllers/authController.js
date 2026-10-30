const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.')
  }

  return jwt.sign(
    {
      id: user.id,
      shopId: user.shop_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  )
}

// POST /api/auth/register
// Register a new shop and its owner.
const register = async (req, res) => {
  const connection = await pool.getConnection()
  let transactionStarted = false

  try {
    const {
      shop_name,
      owner_name,
      email,
      phone,
      address,
      password,
    } = req.body

    if (
      !shop_name ||
      !owner_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, owner name, email, and password are required.',
      })
    }

    if (
      typeof shop_name !== 'string' ||
      typeof owner_name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.',
      })
    }

    if (password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must not exceed 72 characters.',
      })
    }

    if (shop_name.trim().length > 150 || owner_name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Shop name and owner name must not exceed 150 characters.',
      })
    }

    await connection.beginTransaction()
    transactionStarted = true

    // Check whether the shop email already exists.
    const [existingShops] = await connection.execute(
      'SELECT id FROM shops WHERE email = ? LIMIT 1',
      [normalizedEmail]
    )

    if (existingShops.length > 0) {
      await connection.rollback()
      transactionStarted = false

      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create shop.
    const [shopResult] = await connection.execute(
      `INSERT INTO shops (
         shop_name,
         owner_name,
         email,
         phone,
         address,
         status
       )
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        shop_name.trim(),
        owner_name.trim(),
        normalizedEmail,
        phone ? String(phone).trim() : null,
        address ? String(address).trim() : null,
      ]
    )

    const shopId = shopResult.insertId

    // Create owner user.
    const [userResult] = await connection.execute(
      `INSERT INTO users (
         shop_id,
         full_name,
         email,
         password_hash,
         role,
         status
       )
       VALUES (?, ?, ?, ?, 'owner', 'active')`,
      [
        shopId,
        owner_name.trim(),
        normalizedEmail,
        passwordHash,
      ]
    )

    const user = {
      id: userResult.insertId,
      shop_id: shopId,
      full_name: owner_name.trim(),
      email: normalizedEmail,
      role: 'owner',
    }

    const token = generateToken(user)

    await connection.commit()
    transactionStarted = false

    return res.status(201).json({
      success: true,
      message: 'Shop registered successfully.',
      data: {
        shop: {
          id: shopId,
          shop_name: shop_name.trim(),
          owner_name: owner_name.trim(),
          email: normalizedEmail,
        },
        user,
        token,
      },
    })
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback()
    }

    console.error('Registration error:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to register shop.',
    })
  } finally {
    connection.release()
  }
}

// POST /api/auth/login
// Authenticate an existing shop user.
const login = async (req, res) => {
  try {
    const { email, password, shop_id } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format.',
      })
    }

    if (shop_id !== undefined && (
      !Number.isInteger(Number(shop_id)) ||
      Number(shop_id) <= 0
    )) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    let sql = `
      SELECT
        u.id,
        u.shop_id,
        u.full_name,
        u.email,
        u.password_hash,
        u.role,
        u.status AS user_status,
        s.shop_name,
        s.status AS shop_status
      FROM users u
      INNER JOIN shops s ON u.shop_id = s.id
      WHERE u.email = ?
    `

    const values = [normalizedEmail]

    if (shop_id !== undefined) {
      sql += ' AND u.shop_id = ?'
      values.push(Number(shop_id))
    }

    sql += ' ORDER BY u.id ASC'

    const [users] = await pool.execute(sql, values)

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Check passwords against matching accounts.
    const matchingUsers = []

    for (const user of users) {
      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
      )

      if (passwordMatches) {
        matchingUsers.push(user)
      }
    }

    if (matchingUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    if (matchingUsers.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'This email belongs to multiple shops. Please provide shop_id.',
      })
    }

    const user = matchingUsers[0]

    if (user.user_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your user account is inactive.',
      })
    }

    if (user.shop_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This shop account is suspended.',
      })
    }

    const token = generateToken(user)

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          shop_id: user.shop_id,
          shop_name: user.shop_name,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to log in.',
    })
  }
}

module.exports = {
  register,
  login,
}