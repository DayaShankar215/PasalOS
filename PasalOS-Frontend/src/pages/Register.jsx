
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Register = () => {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 8) {
  setError('Password must contain at least 8 characters.')
  return
}

if (formData.password.length > 72) {
  setError('Password must not exceed 72 characters.')
  return
}

    try {
      const registrationData = {
  shop_name: formData.shopName.trim(),
  owner_name: formData.ownerName.trim(),
  email: formData.email.trim(),
  phone: formData.phone.trim(),
  address: formData.address.trim(),
  password: formData.password,
}

const data = await register(registrationData)
      // Registration may or may not automatically log the owner in.
      navigate(data.token ? '/' : '/login')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      )
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-register-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Store size={26} />
          </div>
          <h1>PasalOS</h1>
          <p>Start managing your shop smarter.</p>
        </div>

        <div className="auth-heading">
          <h2>Create Your Account</h2>
          <p>Register your shop to get started.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="shopName">Shop Name</label>
            <input
              id="shopName"
              name="shopName"
              placeholder="Enter your shop name"
              value={formData.shopName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="ownerName">Owner Name</label>
            <input
              id="ownerName"
              name="ownerName"
              placeholder="Enter owner's full name"
              value={formData.ownerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="registerEmail">Email Address</label>
            <input
              id="registerEmail"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="address">Shop Address</label>
            <input
              id="address"
              name="address"
              placeholder="Enter your shop address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="registerPassword">Password</label>
            <input
              id="registerPassword"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <UserPlus size={18} />}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
