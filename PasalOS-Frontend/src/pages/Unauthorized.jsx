
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <ShieldAlert size={64} color="#dc2626" />

      <h1>Access Denied</h1>

      <p>You don't have permission to access this page.</p>

      <Link to="/" style={{ color: '#2563eb', marginTop: '12px' }}>
        Return to Dashboard
      </Link>
    </div>
  )
}
