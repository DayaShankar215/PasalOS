
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach JWT token to protected requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pasalos-token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Handle expired or invalid authentication
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pasalos-token')
    }

    return Promise.reject(error)
  }
)

export default api
