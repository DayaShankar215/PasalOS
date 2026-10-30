const pool = require("../config/db");

const validId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const rollback = async (connection) => {
  try {
    await connection.rollback();
  } catch (error) {
    console.error("Transaction rollback error:", error);
  }
};

// GET all purchases
exports.getPurchases = async (req, res) => {
  try {
    const [purchases] = await pool.execute(
      `SELECT
        p.id,
        p.purchase_number,
        p.supplier_id,
        s.name AS supplier_name,
        p.subtotal,
        p.discount_amount,
        p.tax_amount,
        p.total,
        p.amount_paid,
        p.status,
        p.purchase_date,
        p.created_at
       FROM purchases p
       LEFT JOIN suppliers s
         ON s.id = p.supplier_id
         AND s.shop_id = p.shop_id
       WHERE p.shop_id = ?
       ORDER BY p.purchase_date DESC, p.id DESC`,
      [req.shopId],
    );

    res.json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases.",
    });
  }
};

// GET one purchase with its items
exports.getPurchaseById = async (req, res) => {
  try {
    const purchaseId = validId(req.params.id);

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID.",
      });
    }

    const [purchases] = await pool.execute(
      `SELECT
        p.*,
        s.name AS supplier_name
       FROM purchases p
       LEFT JOIN suppliers s
         ON s.id = p.supplier_id
         AND s.shop_id = p.shop_id
       WHERE p.id = ? AND p.shop_id = ?`,
      [purchaseId, req.shopId],
    );

    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
      });
    }

    const [items] = await pool.execute(
      `SELECT
        id,
        product_id,
        product_name,
        quantity,
        unit_cost,
        line_total
       FROM purchase_items
       WHERE purchase_id = ? AND shop_id = ?
       ORDER BY id`,
      [purchaseId, req.shopId],
    );

    res.json({
      success: true,
      data: {
        ...purchases[0],
        items,
      },
    });
  } catch (error) {
    console.error("Get purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase.",
    });
  }
};

// CREATE a purchase
exports.createPurchase = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      supplier_id = null,
      purchase_date,
      discount_amount = 0,
      tax_amount = 0,
      amount_paid = 0,
      status = "received",
      items,
    } = req.body;

    // Validate supplier ID
    let supplierId = null;

    if (supplier_id !== null && supplier_id !== "") {
      supplierId = validId(supplier_id);

      if (!supplierId) {
        return res.status(400).json({
          success: false,
          message: "Invalid supplier ID.",
        });
      }
    }

    if (supplierId !== null) {
      const [suppliers] = await pool.execute(
        "SELECT id FROM suppliers WHERE id = ? AND shop_id = ?",
        [supplierId, req.shopId],
      );

      if (suppliers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Supplier not found in this shop.",
        });
      }
    }

    if (!validDate(purchase_date)) {
      return res.status(400).json({
        success: false,
        message: "Purchase date must be a valid YYYY-MM-DD date.",
      });
    }

    if (!["pending", "received"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending or received.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required.",
      });
    }

    // Avoid duplicate product lines in the same purchase.
    const productIds = new Set();

    for (const item of items) {
      const productId = validId(item.product_id);
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unit_cost);

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Every item must have a valid product ID.",
        });
      }

      if (productIds.has(productId)) {
        return res.status(400).json({
          success: false,
          message:
            "A product cannot appear more than once. Combine its quantity into one item.",
        });
      }

      productIds.add(productId);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item quantities must be greater than zero.",
        });
      }

      if (!Number.isFinite(unitCost) || unitCost < 0) {
        return res.status(400).json({
          success: false,
          message: "Unit costs must be zero or greater.",
        });
      }
    }

    const discount = Number(discount_amount);
    const tax = Number(tax_amount);
    const paid = Number(amount_paid);

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      !Number.isFinite(tax) ||
      tax < 0 ||
      !Number.isFinite(paid) ||
      paid < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount, tax, and amount paid must be valid non-negative numbers.",
      });
    }

    await connection.beginTransaction();

    // Lock and verify all products before making any changes.
    const sortedIds = [...productIds].sort((a, b) => a - b);
    const productMap = new Map();

    for (const productId of sortedIds) {
      const [products] = await connection.execute(
        `SELECT id, name, sku, stock, cost_price
         FROM products
         WHERE id = ? AND shop_id = ? AND status = 'active'
         FOR UPDATE`,
        [productId, req.shopId],
      );

      if (products.length === 0) {
        await rollback(connection);

        return res.status(400).json({
          success: false,
          message: `Product ${productId} was not found or is inactive.`,
        });
      }

      productMap.set(productId, products[0]);
    }

    const purchaseItems = items.map((item) => {
      const product = productMap.get(Number(item.product_id));
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unit_cost);

      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity,
        unit_cost: unitCost,
        line_total: Number((quantity * unitCost).toFixed(2)),
      };
    });

    const subtotal = Number(
      purchaseItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2),
    );

    const discountValue = Number(discount.toFixed(2));
    const taxValue = Number(tax.toFixed(2));
    const total = Number((subtotal - discountValue + taxValue).toFixed(2));
    const paidValue = Number(paid.toFixed(2));

    if (discountValue > subtotal) {
      await rollback(connection);

      return res.status(400).json({
        success: false,
        message: "Discount cannot exceed the subtotal.",
      });
    }

    if (paidValue > total) {
      await rollback(connection);

      return res.status(400).json({
        success: false,
        message: "Amount paid cannot exceed the purchase total.",
      });
    }

    // Generate a purchase number.
    const purchaseNumber = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [purchaseResult] = await connection.execute(
      `INSERT INTO purchases
        (
          shop_id,
          purchase_number,
          supplier_id,
          subtotal,
          discount_amount,
          tax_amount,
          total,
          amount_paid,
          status,
          purchase_date
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.shopId,
        purchaseNumber,
        supplierId,
        subtotal,
        discountValue,
        taxValue,
        total,
        paidValue,
        status,
        purchase_date,
      ],
    );

    const purchaseId = purchaseResult.insertId;

    for (const item of purchaseItems) {
      await connection.execute(
        `INSERT INTO purchase_items
          (
            shop_id,
            purchase_id,
            product_id,
            product_name,
            quantity,
            unit_cost,
            line_total
          )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.shopId,
          purchaseId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_cost,
          item.line_total,
        ],
      );

      // Only received purchases affect inventory.
      if (status === "received") {
        const product = productMap.get(item.product_id);
        const previousStock = Number(product.stock);
        const newStock = Number((previousStock + item.quantity).toFixed(3));

        await connection.execute(
          `UPDATE products
           SET stock = ?, cost_price = ?
           WHERE id = ? AND shop_id = ?`,
          [newStock, item.unit_cost, item.product_id, req.shopId],
        );

        await connection.execute(
          `INSERT INTO stock_movements
            (
              shop_id,
              product_id,
              movement_type,
              quantity,
              previous_stock,
              new_stock,
              reason,
              reference_type,
              reference_id,
              movement_date
            )
           VALUES (?, ?, 'stock_added', ?, ?, ?, ?, ?, ?, NOW())`,
          [
            req.shopId,
            item.product_id,
            item.quantity,
            previousStock,
            newStock,
            `Purchase ${purchaseNumber}`,
            "purchase",
            purchaseId,
          ],
        );

        // Update the in-memory stock in case it is needed again.
        product.stock = newStock;
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        status === "received"
          ? "Purchase created and stock updated successfully."
          : "Pending purchase created successfully. Stock has not changed.",
      data: {
        id: purchaseId,
        purchase_number: purchaseNumber,
        supplier_id: supplierId,
        subtotal,
        discount_amount: discountValue,
        tax_amount: taxValue,
        total,
        amount_paid: paidValue,
        status,
        purchase_date,
        items: purchaseItems,
      },
    });
  } catch (error) {
    await rollback(connection);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Purchase number already exists. Please try again.",
      });
    }

    console.error("Create purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create purchase.",
    });
  } finally {
    connection.release();
  }
};

// UPDATE purchase status
exports.updatePurchaseStatus = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const purchaseId = validId(req.params.id);
    const { status } = req.body;

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID.",
      });
    }

    if (!["received", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be received or cancelled.",
      });
    }

    await connection.beginTransaction();

    const [purchases] = await connection.execute(
      `SELECT id, purchase_number, status
       FROM purchases
       WHERE id = ? AND shop_id = ?
       FOR UPDATE`,
      [purchaseId, req.shopId],
    );

    if (purchases.length === 0) {
      await rollback(connection);

      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
      });
    }

    const purchase = purchases[0];

    if (purchase.status === status) {
      await rollback(connection);

      return res.status(409).json({
        success: false,
        message: `Purchase is already ${status}.`,
      });
    }

    if (purchase.status === "cancelled") {
      await rollback(connection);

      return res.status(409).json({
        success: false,
        message: "A cancelled purchase cannot be changed.",
      });
    }

    const [items] = await connection.execute(
      `SELECT product_id, product_name, quantity, unit_cost
       FROM purchase_items
       WHERE purchase_id = ? AND shop_id = ?
       ORDER BY product_id`,
      [purchaseId, req.shopId],
    );

    if (items.length === 0) {
      await rollback(connection);

      return res.status(409).json({
        success: false,
        message: "Purchase has no items and cannot change status.",
      });
    }

    // Lock all relevant products before changing stock.
    const productIds = [
      ...new Set(items.map((item) => Number(item.product_id))),
    ].sort((a, b) => a - b);

    const productMap = new Map();

    for (const productId of productIds) {
      const [products] = await connection.execute(
        `SELECT id, name, stock
         FROM products
         WHERE id = ? AND shop_id = ?
         FOR UPDATE`,
        [productId, req.shopId],
      );

      if (products.length === 0) {
        await rollback(connection);

        return res.status(409).json({
          success: false,
          message: `Product ${productId} no longer exists in this shop.`,
        });
      }

      productMap.set(productId, products[0]);
    }

    if (purchase.status === "pending" && status === "received") {
      // Receive pending goods: increase stock once.
      for (const item of items) {
        const product = productMap.get(Number(item.product_id));
        const previousStock = Number(product.stock);
        const quantity = Number(item.quantity);
        const newStock = Number((previousStock + quantity).toFixed(3));

        await connection.execute(
          `UPDATE products
           SET stock = ?, cost_price = ?
           WHERE id = ? AND shop_id = ?`,
          [newStock, item.unit_cost, item.product_id, req.shopId],
        );

        await connection.execute(
          `INSERT INTO stock_movements
            (
              shop_id,
              product_id,
              movement_type,
              quantity,
              previous_stock,
              new_stock,
              reason,
              reference_type,
              reference_id,
              movement_date
            )
           VALUES (?, ?, 'stock_added', ?, ?, ?, ?, ?, ?, NOW())`,
          [
            req.shopId,
            item.product_id,
            quantity,
            previousStock,
            newStock,
            `Received purchase ${purchase.purchase_number}`,
            "purchase",
            purchaseId,
          ],
        );

        product.stock = newStock;
      }
    } else if (purchase.status === "received" && status === "cancelled") {
      // Reverse received goods only if the stock is still available.
      for (const item of items) {
        const product = productMap.get(Number(item.product_id));
        const previousStock = Number(product.stock);
        const quantity = Number(item.quantity);

        if (previousStock < quantity) {
          await rollback(connection);

          return res.status(409).json({
            success: false,
            message: `Cannot cancel this purchase because insufficient stock remains for ${item.product_name}.`,
          });
        }

        const newStock = Number((previousStock - quantity).toFixed(3));

        await connection.execute(
          `UPDATE products
           SET stock = ?
           WHERE id = ? AND shop_id = ?`,
          [newStock, item.product_id, req.shopId],
        );

        await connection.execute(
          `INSERT INTO stock_movements
            (
              shop_id,
              product_id,
              movement_type,
              quantity,
              previous_stock,
              new_stock,
              reason,
              reference_type,
              reference_id,
              movement_date
            )
           VALUES (?, ?, 'stock_removed', ?, ?, ?, ?, ?, ?, NOW())`,
          [
            req.shopId,
            item.product_id,
            quantity,
            previousStock,
            newStock,
            `Cancelled purchase ${purchase.purchase_number}`,
            "purchase",
            purchaseId,
          ],
        );

        product.stock = newStock;
      }
    } else if (purchase.status === "pending" && status === "cancelled") {
      // Pending purchases never affected stock.
    } else {
      await rollback(connection);

      return res.status(409).json({
        success: false,
        message: "This purchase status transition is not allowed.",
      });
    }

    await connection.execute(
      `UPDATE purchases
       SET status = ?
       WHERE id = ? AND shop_id = ?`,
      [status, purchaseId, req.shopId],
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Purchase ${status} successfully.`,
      data: {
        id: purchaseId,
        purchase_number: purchase.purchase_number,
        status,
      },
    });
  } catch (error) {
    await rollback(connection);

    console.error("Update purchase status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update purchase status.",
    });
  } finally {
    connection.release();
  }
};
