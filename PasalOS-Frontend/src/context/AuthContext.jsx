
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'

import {
  loginUser,
  registerUser,
  updateProfile as updateProfileService,
  changePassword as changePasswordService,
  logoutUser,
} from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('pasalos-user')
      ) || null
    } catch {
      return null
    }
  })
  useEffect(() => {
  const handleSessionExpired = () => {
    setUser(null)
  }

  window.addEventListener('pasalos-session-expired', handleSessionExpired)

  return () => {
    window.removeEventListener('pasalos-session-expired', handleSessionExpired)
  }
}, [])

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

  // Update profile and synchronize localStorage
  const updateProfile = async (profileData) => {
    const updatedUser = await updateProfileService(profileData)

    setUser(updatedUser)

    localStorage.setItem(
      'pasalos-user',
      JSON.stringify(updatedUser)
    )

    return updatedUser
  }

  // Change password
  const changePassword = async (passwordData) => {
    return await changePasswordService(passwordData)
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        changePassword,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}
