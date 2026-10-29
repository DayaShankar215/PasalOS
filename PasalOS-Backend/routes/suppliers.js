const express = require('express')
const router = express.Router()

const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/suppliersController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getSuppliers)
router.get('/:id', getSupplierById)
router.post('/', createSupplier)
router.put('/:id', updateSupplier)
router.delete('/:id', deleteSupplier)

module.exports = router