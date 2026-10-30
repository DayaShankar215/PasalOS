const express = require('express')
const router = express.Router()

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productsController')

const { authenticateToken, authorizeRoles} = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager', 'cashier'), getProducts)
router.get('/:id', authorizeRoles('owner', 'manager', 'cashier'), getProductById)

router.post('/', authorizeRoles('owner', 'manager'), createProduct)
router.put('/:id', authorizeRoles('owner', 'manager'), updateProduct)
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteProduct)

module.exports = router