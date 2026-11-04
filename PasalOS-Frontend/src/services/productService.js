
import api from './api'

function normalizeProduct(product, categories = []) {
  const category = categories.find(
    (item) => String(item.id) === String(product.category_id)
  )

  return {
    id: product.id,
    categoryId: product.category_id ?? null,
    name: product.name ?? '',
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    description: product.description ?? '',
    category: category?.name ?? '',
    costPrice: Number(product.cost_price ?? 0),
    sellingPrice: Number(product.selling_price ?? 0),
    stock: Number(product.stock ?? 0),
    minStock: Number(product.min_stock ?? 5),
    unit: product.unit ?? 'Piece',
    status:
      String(product.status ?? 'active').toLowerCase() === 'inactive'
        ? 'Inactive'
        : 'Active',
  }
}

function createPayload(productData, categories) {
  const selectedCategory = categories.find(
    (category) =>
      String(category.id) === String(productData.categoryId) ||
      category.name.toLowerCase() ===
        String(productData.category ?? '').trim().toLowerCase()
  )

  if (!selectedCategory) {
    throw new Error('Please select a valid product category.')
  }

  return {
    name: productData.name.trim(),
    sku: productData.sku.trim(),
    category_id: selectedCategory.id,
    barcode: productData.barcode || null,
    description: productData.description || null,
    cost_price: Number(productData.costPrice),
    selling_price: Number(productData.sellingPrice),
    stock: Number(productData.stock),
    min_stock: Number(productData.minStock ?? 5),
    unit: productData.unit || 'Piece',
    status: (productData.status || 'Active').toLowerCase(),
  }
}

const productService = {
  getAll: async (categories = []) => {
    const response = await api.get('/products')
    const products = response.data.data ?? []

    return products.map((product) =>
      normalizeProduct(product, categories)
    )
  },

  create: async (productData, categories) => {
    const payload = createPayload(productData, categories)
    const response = await api.post('/products', payload)

    return normalizeProduct(response.data.data, categories)
  },

  update: async (id, productData, categories) => {
    const payload = createPayload(productData, categories)
    const response = await api.put(`/products/${id}`, payload)

    return normalizeProduct(response.data.data, categories)
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },
}

export default productService
