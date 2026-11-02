const express = require('express')
const router = express.Router()

// Import user management controllers
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
} = require('../controllers/usersController')

// Import authentication and authorization middleware
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware')

// ============================================
// USER MANAGEMENT ACCESS CONTROL
// ============================================

// All user management endpoints require authentication
router.use(authenticateToken)

// Only shop owners can manage employees
router.use(authorizeRoles('owner'))

// ============================================
// EMPLOYEE MANAGEMENT ROUTES
// ============================================

// Get all employees in the owner's shop
router.get('/', getUsers)

// Get a single employee by ID
router.get('/:id', getUserById)

// Create a new employee
router.post('/', createUser)

// Update employee details and role
router.put('/:id', updateUser)

// Activate or deactivate an employee
router.patch('/:id/status', updateUserStatus)

// Reset an employee's password
router.patch('/:id/password', resetUserPassword)

module.exports = router