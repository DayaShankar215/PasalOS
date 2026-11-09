const express = require('express')
const router = express.Router()

const {
  getStockMovements,
  getStockMovementById,
  adjustStock,
} = require('../controllers/stockMovementsController')

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware')

router.use(authenticateToken)

// View stock movement history.
router.get(
  '/',
  authorizeRoles('owner', 'manager', 'cashier'),
  getStockMovements
)

// View a specific movement.
router.get(
  '/:id',
  authorizeRoles('owner', 'manager', 'cashier'),
  getStockMovementById
)

// Add or remove stock.
router.post(
  '/adjust',
  authorizeRoles('owner', 'manager'),
  adjustStock
)

module.exports = router