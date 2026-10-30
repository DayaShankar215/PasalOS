
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      await login(formData)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your details.'
      )
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Store size={26} />
          </div>
          <h1>PasalOS</h1>
          <p>Smart Management for Your Business</p>
        </div>

        <div className="auth-heading">
          <h2>Welcome Back!</h2>
          <p>Sign in to manage your shop.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-password">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
