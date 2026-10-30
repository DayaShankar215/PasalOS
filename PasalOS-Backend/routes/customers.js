const express = require('express')
const router = express.Router()

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customersController')

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager', 'cashier'), getCustomers)
router.get('/:id', authorizeRoles('owner', 'manager', 'cashier'), getCustomerById)
router.post('/', authorizeRoles('owner', 'manager', 'cashier'), createCustomer)
router.put('/:id', authorizeRoles('owner', 'manager', 'cashier'), updateCustomer)
router.delete('/:id', authorizeRoles('owner', 'manager', 'cashier'), deleteCustomer)

module.exports = router