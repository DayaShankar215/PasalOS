const express = require('express')
const router = express.Router()

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoriesController')

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

// GET all categories
router.get('/', getCategories)

// GET one category
router.get('/:id', getCategoryById)

// CREATE category
router.post('/', createCategory)

// UPDATE category
router.put('/:id', updateCategory)

// DELETE category
router.delete('/:id', deleteCategory)

module.exports = router