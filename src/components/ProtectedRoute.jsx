import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-brand animate-pulse-soft" />
          <p className="text-sm text-dark-400 animate-pulse-soft">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // User is pending approval
  if (user.role === 'pending' || !user.isApproved) {
    return <Navigate to="/pending" replace />
  }

  // Check if user's role is allowed for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    return <Navigate to={user.dashboardPath || '/'} replace />
  }

  return children
}
