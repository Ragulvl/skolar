import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { School, Clock, LogOut, RefreshCw } from 'lucide-react'

export default function PendingApproval() {
  const { user, loading, isAuthenticated, logout, refreshUser } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl gradient-brand animate-pulse-soft" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If user is approved and not pending, redirect to their dashboard
  if (user.role !== 'pending' && user.isApproved) {
    return <Navigate to={user.dashboardPath || '/'} replace />
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-warning/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md mx-4 animate-slide-up">
        <div className="rounded-2xl border border-dark-500/30 bg-dark-800/80 backdrop-blur-xl p-8 shadow-elevated text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>

          <h1 className="text-2xl font-bold font-heading text-dark-50">Pending Approval</h1>
          <p className="text-sm text-dark-300 mt-3 leading-relaxed">
            Your account has been created and is waiting for admin approval.
            You'll be assigned a role shortly.
          </p>

          {/* User info */}
          <div className="mt-6 p-4 rounded-xl bg-dark-700/50 border border-dark-500/30">
            <div className="flex items-center gap-3 justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                  {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-dark-50">{user.name}</p>
                <p className="text-xs text-dark-400">{user.email}</p>
              </div>
            </div>
            {user.institution && (
              <div className="mt-3 pt-3 border-t border-dark-500/20">
                <p className="text-xs text-dark-300">
                  Institution: <span className="text-dark-100 font-medium">{user.institution.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={refreshUser}
              className="w-full py-3 rounded-xl border border-dark-500/40 text-dark-100 font-medium text-sm
                hover:border-brand-500/30 hover:bg-dark-700/40 transition-all duration-200
                flex items-center justify-center gap-2"
              id="check-status-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Check Status
            </button>
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10
                font-medium text-sm transition-all duration-200
                flex items-center justify-center gap-2"
              id="logout-pending-btn"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
