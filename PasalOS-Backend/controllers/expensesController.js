const pool = require('../config/db')

// GET all expenses
exports.getExpenses = async (req, res) => {
  try {
    const [expenses] = await pool.execute(
      `SELECT
        id,
        title,
        category,
        amount,
        expense_date,
        payment_method,
        notes,
        created_at
       FROM expenses
       WHERE shop_id = ?
       ORDER BY expense_date DESC, id DESC`,
      [req.shopId]
    )

    res.json({
      success: true,
      count: expenses.length,
      data: expenses,
    })
  } catch (error) {
    console.error('Get expenses error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses.',
    })
  }
}

// GET one expense
exports.getExpenseById = async (req, res) => {
  try {
    const expenseId = Number(req.params.id)

    if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID.',
      })
    }

    const [expenses] = await pool.execute(
      `SELECT
        id,
        title,
        category,
        amount,
        expense_date,
        payment_method,
        notes,
        created_at
       FROM expenses
       WHERE id = ? AND shop_id = ?`,
      [expenseId, req.shopId]
    )

    if (expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      })
    }

    res.json({
      success: true,
      data: expenses[0],
    })
  } catch (error) {
    console.error('Get expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense.',
    })
  }
}

// CREATE an expense
exports.createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      expense_date,
      payment_method = 'cash',
      notes = null,
    } = req.body

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense title is required.',
      })
    }

    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense category is required.',
      })
    }

    const numericAmount = Number(amount)

    if (
      amount === undefined ||
      amount === null ||
      amount === '' ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number greater than zero.',
      })
    }

    if (
      typeof expense_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expense_date) ||
      Number.isNaN(Date.parse(`${expense_date}T00:00:00Z`))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Expense date must use YYYY-MM-DD format.',
      })
    }

    const allowedPaymentMethods = ['cash', 'card', 'mobile_payment']

    if (!allowedPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.',
      })
    }

    if (notes !== null && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Notes must be a string.',
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO expenses
        (shop_id, title, category, amount, expense_date, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.shopId,
        title.trim(),
        category.trim(),
        numericAmount,
        expense_date,
        payment_method,
        notes?.trim() || null,
      ]
    )

    const [expenses] = await pool.execute(
      `SELECT
        id,
        title,
        category,
        amount,
        expense_date,
        payment_method,
        notes,
        created_at
       FROM expenses
       WHERE id = ? AND shop_id = ?`,
      [result.insertId, req.shopId]
    )

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: expenses[0],
    })
  } catch (error) {
    console.error('Create expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create expense.',
    })
  }
}

// UPDATE an expense
exports.updateExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.id)

    if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID.',
      })
    }

    const {
      title,
      category,
      amount,
      expense_date,
      payment_method = 'cash',
      notes = null,
    } = req.body

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense title is required.',
      })
    }

    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense category is required.',
      })
    }

    const numericAmount = Number(amount)

    if (
      amount === undefined ||
      amount === null ||
      amount === '' ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number greater than zero.',
      })
    }

    if (
      typeof expense_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expense_date) ||
      Number.isNaN(Date.parse(`${expense_date}T00:00:00Z`))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Expense date must use YYYY-MM-DD format.',
      })
    }

    const allowedPaymentMethods = ['cash', 'card', 'mobile_payment']

    if (!allowedPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.',
      })
    }

    if (notes !== null && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Notes must be a string.',
      })
    }

    const [existing] = await pool.execute(
      'SELECT id FROM expenses WHERE id = ? AND shop_id = ?',
      [expenseId, req.shopId]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      })
    }

    await pool.execute(
      `UPDATE expenses
       SET title = ?, category = ?, amount = ?, expense_date = ?,
           payment_method = ?, notes = ?
       WHERE id = ? AND shop_id = ?`,
      [
        title.trim(),
        category.trim(),
        numericAmount,
        expense_date,
        payment_method,
        notes?.trim() || null,
        expenseId,
        req.shopId,
      ]
    )

    const [expenses] = await pool.execute(
      `SELECT
        id,
        title,
        category,
        amount,
        expense_date,
        payment_method,
        notes,
        created_at
       FROM expenses
       WHERE id = ? AND shop_id = ?`,
      [expenseId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: expenses[0],
    })
  } catch (error) {
    console.error('Update expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update expense.',
    })
  }
}

// DELETE an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.id)

    if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID.',
      })
    }

    const [result] = await pool.execute(
      'DELETE FROM expenses WHERE id = ? AND shop_id = ?',
      [expenseId, req.shopId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      })
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully.',
    })
  } catch (error) {
    console.error('Delete expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense.',
    })
  }
}