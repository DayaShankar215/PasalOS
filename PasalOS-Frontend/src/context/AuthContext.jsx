
import { createContext, useContext, useState } from 'react'
import {
  loginUser,
  registerUser,
  logoutUser,
} from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pasalos-user')) || null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  const login = async (credentials) => {
    setLoading(true)

    try {
      const data = await loginUser(credentials)
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)

    try {
      const data = await registerUser(userData)

      if (data.token && data.user) {
        setUser(data.user)
      }

      return data
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
