const express = require('express')
const router = express.Router()

const {
  getStockMovements,
  getStockMovementById,
} = require('../controllers/stockMovementsController')

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', getStockMovements)
router.get('/:id', getStockMovementById)

module.exports = router