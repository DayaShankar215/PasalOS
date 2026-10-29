const pool = require('../config/db')

// GET all customers
exports.getCustomers = async (req, res) => {
  try {
    const [customers] = await pool.execute(
      `SELECT
        c.id,
        c.name,
        c.phone,
        c.email,
        c.address,
        c.credit_balance,
        c.created_at
       FROM customers c
       WHERE c.shop_id = ?
       ORDER BY c.created_at DESC`,
      [req.shopId]
    )

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers.',
    })
  }
}

// GET a single customer
exports.getCustomerById = async (req, res) => {
  try {
    const customerId = Number(req.params.id)

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      })
    }

    const [customers] = await pool.execute(
      `SELECT
        id,
        name,
        phone,
        email,
        address,
        credit_balance,
        created_at
       FROM customers
       WHERE id = ? AND shop_id = ?`,
      [customerId, req.shopId]
    )

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    res.json({
      success: true,
      data: customers[0],
    })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer.',
    })
  }
}

// CREATE a customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone = null,
      email = null,
      address = null,
    } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required.',
      })
    }

    for (const [field, value] of Object.entries({
      phone,
      email,
      address,
    })) {
      if (value !== null && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        })
      }
    }

    const cleanPhone = phone?.trim() || null
    const cleanEmail = email?.trim() || null
    const cleanAddress = address?.trim() || null

    const [result] = await pool.execute(
      `INSERT INTO customers
        (shop_id, name, phone, email, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.shopId,
        name.trim(),
        cleanPhone,
        cleanEmail,
        cleanAddress,
      ]
    )

    const [customers] = await pool.execute(
      `SELECT
        id,
        name,
        phone,
        email,
        address,
        credit_balance,
        created_at
       FROM customers
       WHERE id = ? AND shop_id = ?`,
      [result.insertId, req.shopId]
    )

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customers[0],
    })
  } catch (error) {
    console.error('Create customer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create customer.',
    })
  }
}

// UPDATE a customer
exports.updateCustomer = async (req, res) => {
  try {
    const customerId = Number(req.params.id)
    const { name, phone = null, email = null, address = null } = req.body

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      })
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required.',
      })
    }

    for (const [field, value] of Object.entries({
      phone,
      email,
      address,
    })) {
      if (value !== null && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        })
      }
    }

    const [existing] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND shop_id = ?',
      [customerId, req.shopId]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    await pool.execute(
      `UPDATE customers
       SET name = ?, phone = ?, email = ?, address = ?
       WHERE id = ? AND shop_id = ?`,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        customerId,
        req.shopId,
      ]
    )

    const [customers] = await pool.execute(
      `SELECT
        id,
        name,
        phone,
        email,
        address,
        credit_balance,
        created_at
       FROM customers
       WHERE id = ? AND shop_id = ?`,
      [customerId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Customer updated successfully.',
      data: customers[0],
    })
  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update customer.',
    })
  }
}

// DELETE a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customerId = Number(req.params.id)

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      })
    }

    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ? AND shop_id = ?',
      [customerId, req.shopId]
    )

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      })
    }

    // Prevent deleting customers who have recorded sales.
    const [sales] = await pool.execute(
      'SELECT id FROM sales WHERE customer_id = ? AND shop_id = ? LIMIT 1',
      [customerId, req.shopId]
    )

    if (sales.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'This customer has sales history and cannot be deleted. You can retain the customer record instead.',
      })
    }

    await pool.execute(
      'DELETE FROM customers WHERE id = ? AND shop_id = ?',
      [customerId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Customer deleted successfully.',
    })
  } catch (error) {
    console.error('Delete customer error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer.',
    })
  }
}