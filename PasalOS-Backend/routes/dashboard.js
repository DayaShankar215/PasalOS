const express = require('express')
const router = express.Router()

const {
  getDashboardData,
} = require('../controllers/dashboardController')

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', getDashboardData)

module.exports = router 