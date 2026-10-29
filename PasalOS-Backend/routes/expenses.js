const express = require('express')
const router = express.Router()

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expensesController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getExpenses)
router.get('/:id', getExpenseById)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

module.exports = router