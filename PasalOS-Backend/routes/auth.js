const express = require('express')
const router = express.Router()

const {
  register,
  login,
  updateProfile,
  changePassword,
} = require('../controllers/authController')

const {
  authenticateToken,
} = require('../middleware/authMiddleware')

// Public routes
router.post('/register', register)
router.post('/login', login)

// Protected routes
router.put('/profile', authenticateToken, updateProfile)
router.patch('/change-password', authenticateToken, changePassword)

module.exports = router