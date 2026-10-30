const express = require('express')
const router = express.Router()

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productsController')

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', getProducts)
router.get('/:id', getProductById)
router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

module.exports = router