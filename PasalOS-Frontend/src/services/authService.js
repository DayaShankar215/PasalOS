
import api from './api'

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials)

  const { token, user, shop } = response.data

  localStorage.setItem('pasalos-token', token)
  localStorage.setItem('pasalos-user', JSON.stringify(user))
  localStorage.setItem('pasalos-shop', JSON.stringify(shop))

  return response.data
}

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)

  const { token, user, shop } = response.data

  if (token) {
    localStorage.setItem('pasalos-token', token)
    localStorage.setItem('pasalos-user', JSON.stringify(user))
    localStorage.setItem('pasalos-shop', JSON.stringify(shop))
  }

  return response.data
}

export const logoutUser = () => {
  localStorage.removeItem('pasalos-token')
  localStorage.removeItem('pasalos-user')
  localStorage.removeItem('pasalos-shop')
}
