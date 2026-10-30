const pool = require('../config/db')
const jwt = require('jsonwebtoken')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
      })
    }

    const token = authHeader.slice(7).trim()

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    let decoded

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      })
    }

    if (
      !Number.isInteger(Number(decoded.id)) ||
      Number(decoded.id) <= 0 ||
      !Number.isInteger(Number(decoded.shopId)) ||
      Number(decoded.shopId) <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    // Confirm that the user and their shop are still active.
    const [users] = await pool.execute(
      `SELECT
         u.id,
         u.shop_id,
         u.full_name,
         u.email,
         u.role,
         u.status AS user_status,
         s.status AS shop_status
       FROM users u
       INNER JOIN shops s ON s.id = u.shop_id
       WHERE u.id = ? AND u.shop_id = ?
       LIMIT 1`,
      [Number(decoded.id), Number(decoded.shopId)]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      })
    }

    const user = users[0]

    if (user.user_status !== 'active' || user.shop_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your user account or shop is inactive.',
      })
    }

    req.user = {
      id: user.id,
      shopId: user.shop_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    }

    // All existing controllers can continue using req.shopId.
    req.shopId = user.shop_id

    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)

    return res.status(500).json({
      success: false,
      message: 'Authentication service error.',
    })
  }
}

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      })
    }

    next()
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
}