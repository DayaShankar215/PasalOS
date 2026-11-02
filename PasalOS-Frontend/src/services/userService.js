import api from './api'

const userService = {
  // Get all employees
  getUsers: async () => {
    const response = await api.get('/users')
    return response.data
  },

  // Get one employee
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create employee
  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update employee
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Activate / deactivate employee
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/users/${id}/status`, {
      status,
    })
    return response.data
  },
}

export default userService