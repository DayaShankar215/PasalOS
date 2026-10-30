const express = require('express')
const router = express.Router()

const {
  getSales,
  getSaleById,
  createSale,
} = require('../controllers/salesController')

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', getSales)
router.get('/:id', getSaleById)
router.post('/', createSale)

module.exports = router