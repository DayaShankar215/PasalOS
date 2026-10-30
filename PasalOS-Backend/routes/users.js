
const express = require('express')
const router = express.Router()

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
} = require('../controllers/usersController')

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware')

// All user management endpoints require an authenticated owner
router.use(authenticateToken)
router.use(authorizeRoles('owner'))

router.get('/', getUsers)
router.get('/:id', getUserById)
router.post('/', createUser)
router.put('/:id', updateUser)
router.patch('/:id/status', updateUserStatus)

module.exports = router
