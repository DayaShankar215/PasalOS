
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

const PermissionRoute = ({ module, children, required = 'view' }) => {
  const { user } = useAuth()

  const allowed = hasPermission(user?.role, module, required)

  return allowed ? children : <Navigate to="/unauthorized" replace />
}

export default PermissionRoute
