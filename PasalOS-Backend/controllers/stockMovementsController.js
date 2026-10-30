const pool = require('../config/db')

// GET /api/stock-movements
// Retrieve stock movement history for the current shop.
const getStockMovements = async (req, res) => {
  try {
    const {
      product_id,
      movement_type,
      date_from,
      date_to,
    } = req.query

    const allowedTypes = [
      'stock_added',
      'stock_removed',
      'adjustment',
    ]

    if (product_id && (
      !Number.isInteger(Number(product_id)) ||
      Number(product_id) <= 0
    )) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    if (movement_type && !allowedTypes.includes(movement_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movement type.',
      })
    }

    const validDate = (date) => {
      if (!date) return true
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false

      const parsed = new Date(`${date}T00:00:00.000Z`)

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
      )
    }

    if (!validDate(date_from) || !validDate(date_to)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must use YYYY-MM-DD format.',
      })
    }

    if (date_from && date_to && date_from > date_to) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date.',
      })
    }

    let sql = `
      SELECT
        sm.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM stock_movements sm
      LEFT JOIN products p
        ON sm.product_id = p.id
        AND sm.shop_id = p.shop_id
      WHERE sm.shop_id = ?
    `

    const values = [req.shopId]

    if (product_id) {
      sql += ' AND sm.product_id = ?'
      values.push(Number(product_id))
    }

    if (movement_type) {
      sql += ' AND sm.movement_type = ?'
      values.push(movement_type)
    }

    if (date_from) {
      sql += ' AND sm.movement_date >= ?'
      values.push(`${date_from} 00:00:00`)
    }

    if (date_to) {
      sql += ' AND sm.movement_date < DATE_ADD(?, INTERVAL 1 DAY)'
      values.push(`${date_to} 00:00:00`)
    }

    sql += ' ORDER BY sm.id DESC'

    const [movements] = await pool.execute(sql, values)

    return res.status(200).json({
      success: true,
      count: movements.length,
      data: movements,
    })
  } catch (error) {
    console.error('Get stock movements error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock movements.',
    })
  }
}

// GET /api/stock-movements/:id
// Retrieve one stock movement.
const getStockMovementById = async (req, res) => {
  try {
    const { id } = req.params

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock movement ID.',
      })
    }

    const [movements] = await pool.execute(
      `SELECT
         sm.*,
         p.name AS product_name,
         p.sku AS product_sku
       FROM stock_movements sm
       LEFT JOIN products p
         ON sm.product_id = p.id
        AND sm.shop_id = p.shop_id
       WHERE sm.id = ? AND sm.shop_id = ?
       LIMIT 1`,
      [Number(id), req.shopId]
    )

    if (movements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found.',
      })
    }

    return res.status(200).json({
      success: true,
      data: movements[0],
    })
  } catch (error) {
    console.error('Get stock movement error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock movement.',
    })
  }
}

module.exports = {
  getStockMovements,
  getStockMovementById,
}