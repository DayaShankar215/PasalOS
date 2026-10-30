const pool = require('../config/db')

const validId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0

const validNumber = (value) =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100

const rollback = async (connection) => {
  try {
    await connection.rollback()
  } catch (error) {
    console.error('Transaction rollback failed:', error.message)
  }
}

// GET /api/sales
// Retrieve all sales for the current shop.
const getSales = async (req, res) => {
  try {
    const [sales] = await pool.execute(
      `SELECT
         s.*,
         COALESCE(s.customer_name, c.name, 'Walk-in Customer')
           AS display_customer_name
       FROM sales s
       LEFT JOIN customers c
         ON s.customer_id = c.id
        AND c.shop_id = s.shop_id
       WHERE s.shop_id = ?
       ORDER BY s.id DESC`,
      [req.shopId]
    )

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    })
  } catch (error) {
    console.error('Get sales error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sales.',
    })
  }
}

// GET /api/sales/:id
// Retrieve one sale and its items.
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sale ID.',
      })
    }

    const [sales] = await pool.execute(
      `SELECT
         s.*,
         COALESCE(s.customer_name, c.name, 'Walk-in Customer')
           AS display_customer_name
       FROM sales s
       LEFT JOIN customers c
         ON s.customer_id = c.id
        AND c.shop_id = s.shop_id
       WHERE s.id = ? AND s.shop_id = ?
       LIMIT 1`,
      [Number(id), req.shopId]
    )

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found.',
      })
    }

    const [items] = await pool.execute(
      `SELECT
         id,
         product_id,
         product_name,
         sku,
         quantity,
         unit_price,
         unit_cost,
         discount_amount,
         line_total
       FROM sale_items
       WHERE sale_id = ? AND shop_id = ?
       ORDER BY id ASC`,
      [Number(id), req.shopId]
    )

    return res.status(200).json({
      success: true,
      data: {
        ...sales[0],
        items,
      },
    })
  } catch (error) {
    console.error('Get sale details error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sale details.',
    })
  }
}

// POST /api/sales
// Create a sale, deduct stock, and record stock movements.
const createSale = async (req, res) => {
  const connection = await pool.getConnection()
  let transactionStarted = false

  try {
    const {
      customer_id,
      customer_name,
      subtotal: suppliedSubtotal,
      discount_amount = 0,
      vat_amount = 0,
      payment_method = 'cash',
      amount_paid,
      sale_date,
      items,
    } = req.body

    // Validate customer ID when provided.
    if (
      customer_id !== undefined &&
      customer_id !== null &&
      customer_id !== '' &&
      !validId(customer_id)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      })
    }

    // Validate sale date.
    let normalizedSaleDate = null

    if (sale_date !== undefined && sale_date !== null && sale_date !== '') {
      if (
        typeof sale_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(sale_date)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Sale date must use YYYY-MM-DD format.',
        })
      }

      const parsedDate = new Date(`${sale_date}T00:00:00.000Z`)

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== sale_date
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale date.',
        })
      }

      normalizedSaleDate = sale_date
    }

    // Validate payment method.
    const allowedPaymentMethods = [
      'cash',
      'card',
      'mobile_payment',
      'credit',
    ]

    if (!allowedPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message:
          'Payment method must be cash, card, mobile_payment, or credit.',
      })
    }

    // Validate general discount and VAT amounts.
    if (!validNumber(discount_amount) || !validNumber(vat_amount)) {
      return res.status(400).json({
        success: false,
        message: 'Discount and VAT must be non-negative numbers.',
      })
    }

    // Validate sale items.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A sale must contain at least one item.',
      })
    }

    const productIds = []

    for (const item of items) {
      if (!validId(item.product_id)) {
        return res.status(400).json({
          success: false,
          message: 'Every sale item must have a valid product ID.',
        })
      }

      if (!validNumber(item.quantity) || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantities must be greater than zero.',
        })
      }

      if (
        item.unit_price !== undefined &&
        !validNumber(item.unit_price)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Item prices must be non-negative numbers.',
        })
      }

      if (item.price !== undefined && !validNumber(item.price)) {
        return res.status(400).json({
          success: false,
          message: 'Item prices must be non-negative numbers.',
        })
      }

      if (
        item.discount_amount !== undefined &&
        !validNumber(item.discount_amount)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Item discounts must be non-negative numbers.',
        })
      }

      productIds.push(Number(item.product_id))
    }

    // Prevent duplicate product lines in a single sale.
    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message:
          'Each product should appear only once in the sale. Combine its quantities.',
      })
    }

    if (customer_id) {
      const [customers] = await connection.execute(
        `SELECT id, name
         FROM customers
         WHERE id = ? AND shop_id = ?
         LIMIT 1`,
        [Number(customer_id), req.shopId]
      )

      if (customers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        })
      }
    }

    // Start transaction before reading stock for update.
    await connection.beginTransaction()
    transactionStarted = true

    // Lock products to prevent concurrent sales from overselling stock.
    const sortedProductIds = [...productIds].sort((a, b) => a - b)
    const productMap = new Map()

    for (const productId of sortedProductIds) {
      const [products] = await connection.execute(
        `SELECT
           id,
           name,
           sku,
           cost_price,
           selling_price,
           stock,
           status
         FROM products
         WHERE id = ? AND shop_id = ?
         FOR UPDATE`,
        [productId, req.shopId]
      )

      if (products.length === 0) {
        await rollback(connection)
        transactionStarted = false

        return res.status(404).json({
          success: false,
          message: `Product ID ${productId} was not found.`,
        })
      }

      const product = products[0]

      if (product.status !== 'active') {
        await rollback(connection)
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is inactive.`,
        })
      }

      productMap.set(Number(product.id), product)
    }

    // Calculate line totals using prices stored in the database.
    const preparedItems = []
    let calculatedSubtotal = 0

    for (const item of items) {
      const product = productMap.get(Number(item.product_id))
      const quantity = Number(item.quantity)

      // Use the database selling price rather than trusting the client.
      const unitPrice = roundMoney(product.selling_price)
      const lineSubtotal = roundMoney(unitPrice * quantity)
      const lineDiscount = roundMoney(item.discount_amount || 0)

      if (lineDiscount > lineSubtotal) {
        await rollback(connection)
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message: `Discount exceeds the price for "${product.name}".`,
        })
      }

      if (Number(product.stock) < quantity) {
        await rollback(connection)
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message:
            `Insufficient stock for "${product.name}". ` +
            `Available: ${product.stock}, requested: ${quantity}.`,
        })
      }

      const lineTotal = roundMoney(lineSubtotal - lineDiscount)

      calculatedSubtotal = roundMoney(
        calculatedSubtotal + lineSubtotal
      )

      preparedItems.push({
        product,
        productId: Number(product.id),
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        unitCost: roundMoney(product.cost_price),
        lineDiscount,
        lineTotal,
      })
    }

    // If the frontend sends a subtotal, verify it instead of trusting it.
    if (
      suppliedSubtotal !== undefined &&
      suppliedSubtotal !== null &&
      (
        !validNumber(suppliedSubtotal) ||
        roundMoney(suppliedSubtotal) !== calculatedSubtotal
      )
    ) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'The supplied subtotal does not match the product prices.',
        calculated_subtotal: calculatedSubtotal,
      })
    }

    const totalLineDiscount = roundMoney(
      preparedItems.reduce(
        (sum, item) => sum + item.lineDiscount,
        0
      )
    )

    const generalDiscount = roundMoney(discount_amount)

    if (generalDiscount + totalLineDiscount > calculatedSubtotal) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'Total discounts cannot exceed the subtotal.',
      })
    }

    // VAT is supplied by the frontend, allowing the POS to control
    // whether VAT applies. Validate the final amounts on the server.
    const taxableAmount = roundMoney(
      calculatedSubtotal - totalLineDiscount - generalDiscount
    )

    const vatAmount = roundMoney(vat_amount)

    const total = roundMoney(
      taxableAmount + vatAmount
    )

    const paidAmount =
      amount_paid === undefined || amount_paid === null || amount_paid === ''
        ? total
        : Number(amount_paid)

    if (!validNumber(paidAmount)) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'Amount paid must be a non-negative number.',
      })
    }

    // Credit sales should not be recorded as fully paid by default.
    if (
      payment_method === 'credit' &&
      (amount_paid === undefined || amount_paid === null || amount_paid === '')
    ) {
      // No amount_paid was supplied, so treat the entire sale as unpaid.
    }

    const actualPaidAmount =
      payment_method === 'credit' &&
      (amount_paid === undefined || amount_paid === null || amount_paid === '')
        ? 0
        : roundMoney(paidAmount)

    if (actualPaidAmount > total) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'Amount paid cannot exceed the sale total.',
      })
    }

    if (payment_method !== 'credit' && actualPaidAmount < total) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message:
          'For cash, card, or mobile payments, amount paid must cover the total. Use credit for unpaid balances.',
      })
    }

    if (payment_method === 'credit' && !customer_id) {
      await rollback(connection)
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'A customer is required for a credit sale.',
      })
    }

    const balanceDue = roundMoney(total - actualPaidAmount)
    const changeAmount = roundMoney(
      Math.max(0, actualPaidAmount - total)
    )

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`

    // Insert sale header.
    const [saleResult] = await connection.execute(
      `INSERT INTO sales (
         shop_id,
         invoice_number,
         customer_id,
         customer_name,
         subtotal,
         discount_amount,
         vat_amount,
         total,
         payment_method,
         amount_paid,
         change_amount,
         status,
         sale_date
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed',
               COALESCE(?, CURRENT_DATE))`,
      [
        req.shopId,
        invoiceNumber,
        customer_id ? Number(customer_id) : null,
        customer_name || null,
        calculatedSubtotal,
        roundMoney(generalDiscount + totalLineDiscount),
        vatAmount,
        total,
        payment_method,
        actualPaidAmount,
        changeAmount,
        normalizedSaleDate,
      ]
    )

    const saleId = saleResult.insertId

    // Insert sale items, update stock, and record stock movements.
    for (const item of preparedItems) {
      const previousStock = Number(item.product.stock)
      const newStock = previousStock - item.quantity

      await connection.execute(
        `INSERT INTO sale_items (
           shop_id,
           sale_id,
           product_id,
           product_name,
           sku,
           quantity,
           unit_price,
           unit_cost,
           discount_amount,
           line_total
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.shopId,
          saleId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPrice,
          item.unitCost,
          item.lineDiscount,
          item.lineTotal,
        ]
      )

      await connection.execute(
        `UPDATE products
         SET stock = ?
         WHERE id = ? AND shop_id = ?`,
        [newStock, item.productId, req.shopId]
      )

      await connection.execute(
        `INSERT INTO stock_movements (
           shop_id,
           product_id,
           movement_type,
           quantity,
           previous_stock,
           new_stock,
           reason,
           reference_type,
           reference_id
         )
         VALUES (?, ?, 'stock_removed', ?, ?, ?, ?, 'sale', ?)`,
        [
          req.shopId,
          item.productId,
          item.quantity,
          previousStock,
          newStock,
          `Stock deducted for invoice ${invoiceNumber}`,
          saleId,
        ]
      )
    }

    // Update customer credit balance when there is an unpaid amount.
    if (customer_id && balanceDue > 0) {
      await connection.execute(
        `UPDATE customers
         SET credit_balance = credit_balance + ?
         WHERE id = ? AND shop_id = ?`,
        [balanceDue, Number(customer_id), req.shopId]
      )
    }

    await connection.commit()
    transactionStarted = false

    return res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      data: {
        id: saleId,
        invoice_number: invoiceNumber,
        customer_id: customer_id ? Number(customer_id) : null,
        customer_name: customer_name || 'Walk-in Customer',
        subtotal: calculatedSubtotal,
        discount_amount: roundMoney(
          generalDiscount + totalLineDiscount
        ),
        vat_amount: vatAmount,
        total,
        payment_method,
        amount_paid: actualPaidAmount,
        balance_due: balanceDue,
        change_amount: changeAmount,
        status: 'completed',
        sale_date: normalizedSaleDate,
        items: preparedItems.map((item) => ({
          product_id: item.productId,
          product_name: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.lineDiscount,
          line_total: item.lineTotal,
        })),
      },
    })
  } catch (error) {
    if (transactionStarted) {
      await rollback(connection)
    }

    console.error('Create sale error:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A duplicate invoice or sale record was detected. Please try again.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to complete sale.',
    })
  } finally {
    connection.release()
  }
}

module.exports = {
  getSales,
  getSaleById,
  createSale,
}