const express = require('express')
const router = express.Router()

const {
  getDashboardData,
} = require('../controllers/dashboardController')

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager'), getDashboardData)

module.exports = router