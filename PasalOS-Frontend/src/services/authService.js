
import api from './api'

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials)

  const { token, user } = response.data.data

  localStorage.setItem('pasalos-token', token)
  localStorage.setItem('pasalos-user', JSON.stringify(user))

  return { token, user }
}

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)

  const { token, user, shop } = response.data.data

  if (token) {
    localStorage.setItem('pasalos-token', token)
    localStorage.setItem('pasalos-user', JSON.stringify(user))
    localStorage.setItem('pasalos-shop', JSON.stringify(shop))
  }

  return { token, user, shop }
}

// Update logged-in user's profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData)

  return response.data.data.user
}

// Change logged-in user's password
export const changePassword = async (passwordData) => {
  const response = await api.patch(
    '/auth/change-password',
    passwordData
  )

  return response.data
}

export const logoutUser = () => {
  localStorage.removeItem('pasalos-token')
  localStorage.removeItem('pasalos-user')
  localStorage.removeItem('pasalos-shop')
}
