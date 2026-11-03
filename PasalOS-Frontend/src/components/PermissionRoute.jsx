
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'

const PermissionRoute = ({
  module,
  children,
  required = 'view',
}) => {
  const { user, isAuthenticated } = useAuth()

  // Prevent access when no authenticated user exists.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check the user's role and required permission.
  const allowed = hasPermission(
    user.role,
    module,
    required
  )

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default PermissionRoute
