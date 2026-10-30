const express = require('express')
const router = express.Router()

const {
  getStockMovements,
  getStockMovementById,
} = require('../controllers/stockMovementsController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getStockMovements)
router.get('/:id', getStockMovementById)

module.exports = router