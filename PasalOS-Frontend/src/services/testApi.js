import api from './api'

export const testApiConnection = async () => {
  try {
    const response = await api.get('/health')
    console.log('Backend connected:', response.data)
    return response.data
  } catch (error) {
    console.error(
      'Backend connection failed:',
      error.response?.data || error.message
    )
    throw error
  }
}