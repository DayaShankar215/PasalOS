const express = require("express");
const router = express.Router();

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
} = require("../controllers/purchasesController");

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get('/', authorizeRoles('owner', 'manager'), getPurchases)
router.get('/:id', authorizeRoles('owner', 'manager'), getPurchaseById)
router.post('/', authorizeRoles('owner', 'manager'), createPurchase)
router.patch('/:id/status', authorizeRoles('owner', 'manager'), updatePurchaseStatus)
module.exports = router;
