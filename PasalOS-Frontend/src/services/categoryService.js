import api from './api'

const categoryService = {
  // Get all categories for the logged-in shop
  getAll: async () => {
    const response = await api.get('/categories')
    return response.data.data
  },

  // Create a category
  create: async (categoryData) => {
    const response = await api.post('/categories', {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || '',
    })

    return response.data.data
  },

  // Update a category
  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || '',
    })

    return response.data.data
  },

  // Delete a category
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },
}

export default categoryService