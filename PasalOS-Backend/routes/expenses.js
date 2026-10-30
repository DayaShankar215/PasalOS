const express = require('express')
const router = express.Router()

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expensesController')

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager'), getExpenses)
router.get('/:id', authorizeRoles('owner', 'manager'), getExpenseById)
router.post('/', authorizeRoles('owner', 'manager'), createExpense)
router.put('/:id', authorizeRoles('owner', 'manager'), updateExpense)
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteExpense)

module.exports = router