const express = require('express')
const router = express.Router()

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoriesController')

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager', 'cashier'), getCategories)
router.get('/:id', authorizeRoles('owner', 'manager', 'cashier'), getCategoryById)

router.post('/', authorizeRoles('owner', 'manager'), createCategory)
router.put('/:id', authorizeRoles('owner', 'manager'), updateCategory)
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteCategory)

module.exports = router