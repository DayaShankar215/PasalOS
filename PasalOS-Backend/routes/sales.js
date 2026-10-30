const express = require('express')
const router = express.Router()

const {
  getSales,
  getSaleById,
  createSale,
} = require('../controllers/salesController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getSales)
router.get('/:id', getSaleById)
router.post('/', createSale)

module.exports = router