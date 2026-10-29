const pool = require('../config/db')

// GET /api/products
// Get all products belonging to the development shop
exports.getProducts = async (req, res) => {
  try {
    const shopId = req.shopId

    const [products] = await pool.execute(
      `SELECT
        id,
        category_id,
        name,
        sku,
        barcode,
        description,
        cost_price,
        selling_price,
        stock,
        min_stock,
        unit,
        status,
        created_at,
        updated_at
      FROM products
      WHERE shop_id = ?
      ORDER BY id DESC`,
      [shopId]
    )

    res.json({
      success: true,
      count: products.length,
      data: products,
    })
  } catch (error) {
    console.error('Get products error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products.',
    })
  }
}

// GET /api/products/:id
// Get one product
exports.getProductById = async (req, res) => {
  try {
    const shopId = req.shopId
    const productId = Number(req.params.id)

    const [products] = await pool.execute(
      `SELECT *
       FROM products
       WHERE id = ? AND shop_id = ?`,
      [productId, shopId]
    )

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    res.json({
      success: true,
      data: products[0],
    })
  } catch (error) {
    console.error('Get product error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product.',
    })
  }
}

// POST /api/products
// Create a product
exports.createProduct = async (req, res) => {
  try {
    const shopId = req.shopId

    const {
      category_id,
      name,
      sku,
      barcode,
      description,
      cost_price = 0,
      selling_price,
      stock = 0,
      min_stock = 5,
      unit = 'pcs',
      status = 'active',
    } = req.body

    if (
      !name?.trim() ||
      !sku?.trim() ||
      selling_price === undefined ||
      selling_price === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, and selling price are required.',
      })
    }

    const cost = Number(cost_price)
    const price = Number(selling_price)
    const quantity = Number(stock)
    const minimumStock = Number(min_stock)

    if (
      !Number.isFinite(cost) ||
      !Number.isFinite(price) ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(minimumStock) ||
      cost < 0 ||
      price < 0 ||
      quantity < 0 ||
      minimumStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Prices and stock values must be valid non-negative numbers.',
      })
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product status.',
      })
    }

    let categoryId = null

    if (category_id !== undefined && category_id !== null && category_id !== '') {
      categoryId = Number(category_id)

      if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID.',
        })
      }

      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE id = ? AND shop_id = ?',
        [categoryId, shopId]
      )

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Category not found for this shop.',
        })
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO products (
        shop_id,
        category_id,
        name,
        sku,
        barcode,
        description,
        cost_price,
        selling_price,
        stock,
        min_stock,
        unit,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        categoryId,
        name.trim(),
        sku.trim(),
        barcode?.trim() || null,
        description?.trim() || null,
        cost,
        price,
        quantity,
        minimumStock,
        unit?.trim() || 'pcs',
        status,
      ]
    )

    const [products] = await pool.execute(
      `SELECT *
       FROM products
       WHERE id = ? AND shop_id = ?`,
      [result.insertId, shopId]
    )

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: products[0],
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A product with this SKU already exists in this shop.',
      })
    }

    console.error('Create product error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to create product.',
    })
  }
}

// PUT /api/products/:id
// Update an existing product
exports.updateProduct = async (req, res) => {
  try {
    const shopId = req.shopId
    const productId = Number(req.params.id)

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const [existingProducts] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    )

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    const current = existingProducts[0]

    const {
      category_id,
      name,
      sku,
      barcode,
      description,
      cost_price,
      selling_price,
      stock,
      min_stock,
      unit,
      status,
    } = req.body

    const updatedName = name === undefined ? current.name : name
    const updatedSku = sku === undefined ? current.sku : sku
    const updatedCost = cost_price === undefined
      ? Number(current.cost_price)
      : Number(cost_price)
    const updatedPrice = selling_price === undefined
      ? Number(current.selling_price)
      : Number(selling_price)
    const updatedStock = stock === undefined
      ? Number(current.stock)
      : Number(stock)
    const updatedMinimum = min_stock === undefined
      ? Number(current.min_stock)
      : Number(min_stock)

    if (
      typeof updatedName !== 'string' ||
      !updatedName.trim() ||
      typeof updatedSku !== 'string' ||
      !updatedSku.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Product name and SKU cannot be empty.',
      })
    }

    if (
      !Number.isFinite(updatedCost) ||
      !Number.isFinite(updatedPrice) ||
      !Number.isFinite(updatedStock) ||
      !Number.isFinite(updatedMinimum) ||
      updatedCost < 0 ||
      updatedPrice < 0 ||
      updatedStock < 0 ||
      updatedMinimum < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Prices and stock values must be valid non-negative numbers.',
      })
    }

    const updatedStatus = status === undefined ? current.status : status

    if (!['active', 'inactive'].includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product status.',
      })
    }

    let updatedCategoryId = current.category_id

    if (category_id !== undefined) {
      if (category_id === null || category_id === '') {
        updatedCategoryId = null
      } else {
        updatedCategoryId = Number(category_id)

        if (
          !Number.isSafeInteger(updatedCategoryId) ||
          updatedCategoryId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID.',
          })
        }

        const [categories] = await pool.execute(
          'SELECT id FROM categories WHERE id = ? AND shop_id = ?',
          [updatedCategoryId, shopId]
        )

        if (categories.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Category not found for this shop.',
          })
        }
      }
    }

    await pool.execute(
      `UPDATE products
       SET category_id = ?,
           name = ?,
           sku = ?,
           barcode = ?,
           description = ?,
           cost_price = ?,
           selling_price = ?,
           stock = ?,
           min_stock = ?,
           unit = ?,
           status = ?
       WHERE id = ? AND shop_id = ?`,
      [
        updatedCategoryId,
        updatedName.trim(),
        updatedSku.trim(),
        barcode === undefined ? current.barcode : barcode || null,
        description === undefined ? current.description : description || null,
        updatedCost,
        updatedPrice,
        updatedStock,
        updatedMinimum,
        unit === undefined ? current.unit : unit || 'pcs',
        updatedStatus,
        productId,
        shopId,
      ]
    )

    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    )

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: products[0],
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A product with this SKU already exists in this shop.',
      })
    }

    console.error('Update product error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to update product.',
    })
  }
}

// DELETE /api/products/:id
// Delete a product if it is not used by transactions
exports.deleteProduct = async (req, res) => {
  try {
    const shopId = req.shopId
    const productId = Number(req.params.id)

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    )

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    const [sales] = await pool.execute(
      'SELECT id FROM sale_items WHERE product_id = ? AND shop_id = ? LIMIT 1',
      [productId, shopId]
    )

    const [purchases] = await pool.execute(
      'SELECT id FROM purchase_items WHERE product_id = ? AND shop_id = ? LIMIT 1',
      [productId, shopId]
    )

    if (sales.length > 0 || purchases.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This product has transaction history. Mark it inactive instead of deleting it.',
      })
    }

    await pool.execute(
      'DELETE FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    )

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    })
  } catch (error) {
    console.error('Delete product error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Failed to delete product.',
    })
  }
}