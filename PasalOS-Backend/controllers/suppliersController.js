const pool = require('../config/db')

// GET all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const [suppliers] = await pool.execute(
      `SELECT
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        created_at
       FROM suppliers
       WHERE shop_id = ?
       ORDER BY created_at DESC`,
      [req.shopId]
    )

    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    })
  } catch (error) {
    console.error('Get suppliers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers.',
    })
  }
}

// GET one supplier
exports.getSupplierById = async (req, res) => {
  try {
    const supplierId = Number(req.params.id)

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID.',
      })
    }

    const [suppliers] = await pool.execute(
      `SELECT
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        created_at
       FROM suppliers
       WHERE id = ? AND shop_id = ?`,
      [supplierId, req.shopId]
    )

    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      })
    }

    res.json({
      success: true,
      data: suppliers[0],
    })
  } catch (error) {
    console.error('Get supplier error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier.',
    })
  }
}

// CREATE a supplier
exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      contact_person = null,
      phone = null,
      email = null,
      address = null,
    } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required.',
      })
    }

    const optionalFields = {
      contact_person,
      phone,
      email,
      address,
    }

    for (const [field, value] of Object.entries(optionalFields)) {
      if (value !== null && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        })
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO suppliers
        (shop_id, name, contact_person, phone, email, address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.shopId,
        name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
      ]
    )

    const [suppliers] = await pool.execute(
      `SELECT
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        created_at
       FROM suppliers
       WHERE id = ? AND shop_id = ?`,
      [result.insertId, req.shopId]
    )

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      data: suppliers[0],
    })
  } catch (error) {
    console.error('Create supplier error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier.',
    })
  }
}

// UPDATE a supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id)

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID.',
      })
    }

    const {
      name,
      contact_person = null,
      phone = null,
      email = null,
      address = null,
    } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required.',
      })
    }

    const optionalFields = {
      contact_person,
      phone,
      email,
      address,
    }

    for (const [field, value] of Object.entries(optionalFields)) {
      if (value !== null && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        })
      }
    }

    const [existing] = await pool.execute(
      'SELECT id FROM suppliers WHERE id = ? AND shop_id = ?',
      [supplierId, req.shopId]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      })
    }

    await pool.execute(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?
       WHERE id = ? AND shop_id = ?`,
      [
        name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        supplierId,
        req.shopId,
      ]
    )

    const [suppliers] = await pool.execute(
      `SELECT
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        created_at
       FROM suppliers
       WHERE id = ? AND shop_id = ?`,
      [supplierId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Supplier updated successfully.',
      data: suppliers[0],
    })
  } catch (error) {
    console.error('Update supplier error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier.',
    })
  }
}

// DELETE a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id)

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID.',
      })
    }

    const [suppliers] = await pool.execute(
      'SELECT id FROM suppliers WHERE id = ? AND shop_id = ?',
      [supplierId, req.shopId]
    )

    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      })
    }

    // Preserve supplier records associated with purchase history.
    const [purchases] = await pool.execute(
      'SELECT id FROM purchases WHERE supplier_id = ? AND shop_id = ? LIMIT 1',
      [supplierId, req.shopId]
    )

    if (purchases.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'This supplier has purchase history and cannot be deleted.',
      })
    }

    await pool.execute(
      'DELETE FROM suppliers WHERE id = ? AND shop_id = ?',
      [supplierId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Supplier deleted successfully.',
    })
  } catch (error) {
    console.error('Delete supplier error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier.',
    })
  }
}