const pool = require('../config/db')

// GET /api/dashboard
// Retrieve dashboard statistics for the current shop.
const getDashboardData = async (req, res) => {
  try {
    // Current month statistics.
    const [summaryRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_sales,
         COALESCE(SUM(vat_amount), 0) AS total_vat
       FROM sales
       WHERE shop_id = ?
         AND status = 'completed'
         AND sale_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
         AND sale_date < DATE_ADD(
           LAST_DAY(CURRENT_DATE),
           INTERVAL 1 DAY
         )`,
      [req.shopId]
    )

    // Cost of goods sold for completed sales this month.
    const [costRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(si.quantity * si.unit_cost), 0) AS total_cost
       FROM sale_items si
       INNER JOIN sales s
         ON si.sale_id = s.id
        AND si.shop_id = s.shop_id
       WHERE si.shop_id = ?
         AND s.status = 'completed'
         AND s.sale_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
         AND s.sale_date < DATE_ADD(
           LAST_DAY(CURRENT_DATE),
           INTERVAL 1 DAY
         )`,
      [req.shopId]
    )

    // Current month expenses.
    const [expenseRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_expenses
       FROM expenses
       WHERE shop_id = ?
         AND expense_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
         AND expense_date < DATE_ADD(
           LAST_DAY(CURRENT_DATE),
           INTERVAL 1 DAY
         )`,
      [req.shopId]
    )

    const summary = summaryRows[0]
    const totalCost = Number(costRows[0].total_cost)
    const totalExpenses = Number(expenseRows[0].total_expenses)

    const totalSales = Number(summary.total_sales)
    const totalVat = Number(summary.total_vat)

    // Exclude VAT from sales revenue when estimating profit.
    const grossProfit = totalSales - totalVat - totalCost
    const netProfit = grossProfit - totalExpenses

    // Low-stock products.
    const [lowStockProducts] = await pool.execute(
      `SELECT
         id,
         name,
         sku,
         stock,
         min_stock,
         unit
       FROM products
       WHERE shop_id = ?
         AND status = 'active'
         AND stock <= min_stock
       ORDER BY stock ASC
       LIMIT 10`,
      [req.shopId]
    )

    // Sales chart for the last seven days.
    const [chartRows] = await pool.execute(
      `SELECT
         DATE(sale_date) AS sale_day,
         COALESCE(SUM(total), 0) AS sales
       FROM sales
       WHERE shop_id = ?
         AND status = 'completed'
         AND sale_date >= CURRENT_DATE - INTERVAL 6 DAY
         AND sale_date < CURRENT_DATE + INTERVAL 1 DAY
       GROUP BY DATE(sale_date)
       ORDER BY sale_day ASC`,
      [req.shopId]
    )

    // Create seven chart entries, including days with zero sales.
    const chartMap = new Map(
      chartRows.map((row) => [
        new Date(row.sale_day).toISOString().slice(0, 10),
        Number(row.sales),
      ])
    )

    const salesChart = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - i)

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      salesChart.push({
        date: dateKey,
        day: date.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        sales: chartMap.get(dateKey) || 0,
      })
    }

    // Recent completed sales.
    const [recentSales] = await pool.execute(
      `SELECT
         s.id,
         s.invoice_number,
         s.customer_name,
         s.total,
         s.payment_method,
         s.sale_date,
         COALESCE(c.name, s.customer_name, 'Walk-in Customer')
           AS display_customer_name
       FROM sales s
       LEFT JOIN customers c
         ON s.customer_id = c.id
        AND s.shop_id = c.shop_id
       WHERE s.shop_id = ?
         AND s.status = 'completed'
       ORDER BY s.id DESC
       LIMIT 5`,
      [req.shopId]
    )

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_orders: Number(summary.total_orders),
          total_sales: Number(totalSales.toFixed(2)),
          total_expenses: Number(totalExpenses.toFixed(2)),
          total_cost: Number(totalCost.toFixed(2)),
          gross_profit: Number(grossProfit.toFixed(2)),
          net_profit: Number(netProfit.toFixed(2)),
          total_vat: Number(totalVat.toFixed(2)),
        },
        sales_chart: salesChart,
        low_stock_products: lowStockProducts,
        recent_sales: recentSales,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data.',
    })
  }
}

module.exports = {
  getDashboardData,
}