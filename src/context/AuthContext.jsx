import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors
    }
    setUser(null)
    navigate('/', { replace: true })
  }

  const refreshUser = () => fetchUser()

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
