const express = require("express");
const router = express.Router();

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
} = require("../controllers/purchasesController");

const { authenticateToken } = require('../middleware/authMiddleware')

router.use(authenticateToken)

router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.post("/", createPurchase);
router.patch("/:id/status", updatePurchaseStatus);
module.exports = router;
