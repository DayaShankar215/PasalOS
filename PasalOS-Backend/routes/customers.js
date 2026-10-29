const express = require('express')
const router = express.Router()

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customersController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getCustomers)
router.get('/:id', getCustomerById)
router.post('/', createCustomer)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

module.exports = router