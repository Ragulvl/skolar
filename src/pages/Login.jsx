import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { School, ArrowLeft, Sparkles } from 'lucide-react'

export default function Login() {
  const { user, loading, isAuthenticated, login } = useAuth()

  if (!loading && isAuthenticated && user) {
    return <Navigate to={user.dashboardPath || '/dashboard/superadmin'} replace />
  }

  const urlParams = new URLSearchParams(window.location.search)
  const error = urlParams.get('error')

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid opacity-15" />
      <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[160px] animate-pulse-soft" />
      <div className="absolute bottom-1/3 -right-40 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[160px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md mx-4 animate-slide-up">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-dark-500/30 bg-dark-800/80 backdrop-blur-xl shadow-elevated overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 gradient-brand" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
                <School className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold font-heading text-dark-50">Welcome Back</h1>
                <p className="text-sm text-dark-400 mt-1">Sign in to continue to Skolar</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger text-center animate-scale-in">
                {error === 'auth_failed'
                  ? 'Authentication failed. Please try again.'
                  : error === 'account_exists'
                  ? 'An account with this email already exists. Sign in instead.'
                  : 'An error occurred. Please try again.'}
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={login}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl
                bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm
                transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01]
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              id="google-signin-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Loading...' : 'Sign in with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-dark-500/30" />
              <span className="text-xs text-dark-500 font-medium">New to Skolar?</span>
              <div className="flex-1 h-px bg-dark-500/30" />
            </div>

            {/* Sign Up link */}
            <Link
              to="/signup"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                border border-dark-500/40 text-dark-200 font-medium text-sm
                hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-dark-50
                transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Create a new account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-dark-500 mt-6">
          By signing in, you agree to Skolar's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
