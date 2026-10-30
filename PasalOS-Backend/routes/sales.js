const express = require('express')
const router = express.Router()

const {
  getSales,
  getSaleById,
  createSale,
} = require('../controllers/salesController')

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager', 'cashier'), getSales)
router.get('/:id', authorizeRoles('owner', 'manager', 'cashier'), getSaleById)
router.post('/', authorizeRoles('owner', 'manager', 'cashier'), createSale)

module.exports = router