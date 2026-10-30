const express = require('express')
const router = express.Router()

const {
  getStockMovements,
  getStockMovementById,
} = require('../controllers/stockMovementsController')

const { authenticateToken, authorizeRoles} = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager', 'cashier'), getStockMovements)
router.get('/:id', authorizeRoles('owner', 'manager', 'cashier'), getStockMovementById)
module.exports = router