const pool = require('../config/db')

// GET all categories for the current shop
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p
         ON p.category_id = c.id
         AND p.shop_id = c.shop_id
       WHERE c.shop_id = ?
       GROUP BY c.id, c.name, c.description, c.created_at
       ORDER BY c.name ASC`,
      [req.shopId]
    )

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
    })
  }
}

// GET a single category
exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID.',
      })
    }

    const [categories] = await pool.execute(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p
         ON p.category_id = c.id
         AND p.shop_id = c.shop_id
       WHERE c.id = ? AND c.shop_id = ?
       GROUP BY c.id, c.name, c.description, c.created_at`,
      [categoryId, req.shopId]
    )

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      })
    }

    res.json({
      success: true,
      data: categories[0],
    })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category.',
    })
  }
}

// CREATE a category
exports.createCategory = async (req, res) => {
  try {
    const { name, description = null } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      })
    }

    if (
      description !== null &&
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Description must be a string.',
      })
    }

    const cleanName = name.trim()
    const cleanDescription =
      typeof description === 'string' && description.trim()
        ? description.trim()
        : null

    const [result] = await pool.execute(
      `INSERT INTO categories (shop_id, name, description)
       VALUES (?, ?, ?)`,
      [req.shopId, cleanName, cleanDescription]
    )

    const [categories] = await pool.execute(
      `SELECT id, name, description, created_at
       FROM categories
       WHERE id = ? AND shop_id = ?`,
      [result.insertId, req.shopId]
    )

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: categories[0],
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      })
    }

    console.error('Create category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create category.',
    })
  }
}

// UPDATE a category
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)
    const { name, description = null } = req.body

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID.',
      })
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      })
    }

    if (
      description !== null &&
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Description must be a string.',
      })
    }

    const cleanName = name.trim()
    const cleanDescription =
      typeof description === 'string' && description.trim()
        ? description.trim()
        : null

    const [result] = await pool.execute(
      `UPDATE categories
       SET name = ?, description = ?
       WHERE id = ? AND shop_id = ?`,
      [cleanName, cleanDescription, categoryId, req.shopId]
    )

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        'SELECT id FROM categories WHERE id = ? AND shop_id = ?',
        [categoryId, req.shopId]
      )

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found.',
        })
      }
    }

    const [categories] = await pool.execute(
      `SELECT id, name, description, created_at
       FROM categories
       WHERE id = ? AND shop_id = ?`,
      [categoryId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: categories[0],
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      })
    }

    console.error('Update category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update category.',
    })
  }
}

// DELETE a category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID.',
      })
    }

    const [categories] = await pool.execute(
      `SELECT id
       FROM categories
       WHERE id = ? AND shop_id = ?`,
      [categoryId, req.shopId]
    )

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      })
    }

    // Products using this category will remain; their category_id
    // becomes NULL because of the database foreign key.
    await pool.execute(
      'DELETE FROM categories WHERE id = ? AND shop_id = ?',
      [categoryId, req.shopId]
    )

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
    })
  }
}