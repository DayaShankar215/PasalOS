const express = require('express')
const router = express.Router()

const {
  getDashboardData,
} = require('../controllers/dashboardController')

const developmentShop = require('../middleware/developmentShop')

router.use(developmentShop)

router.get('/', getDashboardData)

module.exports = router 