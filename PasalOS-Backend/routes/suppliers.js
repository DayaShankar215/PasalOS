const express = require('express')
const router = express.Router()

const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/suppliersController')

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager'), getSuppliers)
router.get('/:id', authorizeRoles('owner', 'manager'), getSupplierById)
router.post('/', authorizeRoles('owner', 'manager'), createSupplier)
router.put('/:id', authorizeRoles('owner', 'manager'), updateSupplier)
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteSupplier)

module.exports = router