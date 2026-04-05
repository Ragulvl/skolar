import { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  School, ArrowLeft, ArrowRight, GraduationCap, BookOpen,
  CheckCircle2, Loader2, Search, MapPin, Hash, Building2, User, X,
  Mail, Lock, Eye, EyeOff
} from 'lucide-react'
import api from '../api/client'

export default function Signup() {
  const { user, loading: authLoading, isAuthenticated, login, registerWithEmail, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // Steps: 1 = Auth Method, 2 = Pick Institution, 3 = Confirm, 4 = Set Password (Google users only)
  const [step, setStep] = useState(token ? 2 : 1)

  // Auth method state
  const [authMethod, setAuthMethod] = useState(null) // 'google' | 'email'
  const [emailForm, setEmailForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [localToken, setLocalToken] = useState(token || null)

  // Step 4: Set Password state (for Google users)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Institution state
  const [instType, setInstType] = useState(null)
  const [searchMode, setSearchMode] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [institution, setInstitution] = useState(null)
  const [institutionCode, setInstitutionCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Signup state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Google user info from token
  const [googleUser, setGoogleUser] = useState(null)

  const searchRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceTimer = useRef(null)

  // Decode temp token (works for both Google and email/password tokens)
  useEffect(() => {
    const activeToken = localToken
    if (activeToken) {
      try {
        const payload = JSON.parse(atob(activeToken.split('.')[1]))
        setGoogleUser(payload)
        if (payload.authProvider === 'local') {
          setAuthMethod('email')
        }
      } catch {
        setError('Invalid signup token. Please start over.')
      }
    }
  }, [localToken])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If already authenticated and approved, redirect
  if (!authLoading && isAuthenticated && user && user.role !== 'pending' && user.isApproved) {
    return <Navigate to={user.dashboardPath || '/'} replace />
  }

  // ──────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────

  // Email/password registration (Step 1)
  const handleEmailRegister = async (e) => {
    e.preventDefault()
    setError('')

    const { name, email, password, confirmPassword } = emailForm

    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setRegistering(true)
    try {
      const data = await registerWithEmail(name.trim(), email.trim(), password)
      setLocalToken(data.token)
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      const code = err.response?.data?.code
      if (code === 'GOOGLE_ACCOUNT_EXISTS') {
        setError('An account with this email exists via Google. Sign in with Google first, then add a password in Settings.')
      } else {
        setError(msg)
      }
    } finally {
      setRegistering(false)
    }
  }

  // Debounced search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    setError('')

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (query.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const params = { q: query.trim() }
        if (instType) params.type = instType
        const res = await api.get('/auth/search-institutions', { params })
        setSearchResults(res.data.data || [])
        setShowDropdown(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [instType])

  const selectInstitution = (inst) => {
    setInstitution(inst)
    setSearchQuery(inst.name)
    setShowDropdown(false)
    setError('')
  }

  const validateCode = async () => {
    if (!institutionCode.trim()) {
      setError('Please enter an institution code')
      return
    }
    setValidating(true)
    setError('')
    try {
      const res = await api.post('/auth/validate-code', { code: institutionCode.trim() })
      setInstitution(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid institution code')
    } finally {
      setValidating(false)
    }
  }

  const handleSignup = async () => {
    if (!localToken || !institution) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/auth/signup', {
        token: localToken,
        institutionCode: institution.code,
      })
      await refreshUser()

      // Google users → go to Step 4 to set a password
      // Email/password users already have a password → go to /pending
      const isLocalSignup = googleUser?.authProvider === 'local'
      if (isLocalSignup) {
        setSuccess(true)
      } else {
        setStep(4)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 4: Set password for Google users
  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    setSettingPassword(true)
    try {
      await api.post('/auth/set-password', { password: newPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set password')
    } finally {
      setSettingPassword(false)
    }
  }

  // Step 4: Skip password (optional)
  const skipPassword = () => {
    setSuccess(true)
  }

  const goToConfirm = () => {
    if (!institution) {
      setError('Please select your institution first')
      return
    }
    setStep(3)
  }

  const clearInstitution = () => {
    setInstitution(null)
    setSearchQuery('')
    setInstitutionCode('')
  }

  if (success) {
    return <Navigate to="/pending" replace />
  }

  // ──────────────────────────────────────────────
  // STEP RENDERERS
  // ──────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand-subtle mx-auto flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-lg font-semibold text-dark-50">Let's get started</h2>
        <p className="text-sm text-dark-400 mt-1">Choose how you'd like to create your account</p>
      </div>

      {/* Google signup button */}
      <button
        onClick={login}
        disabled={authLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl
          bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm
          transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01]
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        id="google-signup-btn"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {authLoading ? 'Loading...' : 'Sign up with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-dark-500/30" />
        <span className="text-xs text-dark-500 font-medium">Or sign up with email</span>
        <div className="flex-1 h-px bg-dark-500/30" />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailRegister} className="space-y-3">
        <div>
          <label className="text-sm text-dark-300 mb-1 block font-medium">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={emailForm.name}
              onChange={(e) => { setEmailForm(p => ({ ...p, name: e.target.value })); setError('') }}
              placeholder="John Doe"
              className="input-base pl-10"
              id="signup-name"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-dark-300 mb-1 block font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) => { setEmailForm(p => ({ ...p, email: e.target.value })); setError('') }}
              placeholder="you@example.com"
              className="input-base pl-10"
              id="signup-email"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-dark-300 mb-1 block font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={emailForm.password}
              onChange={(e) => { setEmailForm(p => ({ ...p, password: e.target.value })); setError('') }}
              placeholder="Min 6 characters"
              className="input-base pl-10 pr-10"
              id="signup-password"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-dark-300 mb-1 block font-medium">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={emailForm.confirmPassword}
              onChange={(e) => { setEmailForm(p => ({ ...p, confirmPassword: e.target.value })); setError('') }}
              placeholder="Re-enter your password"
              className="input-base pl-10"
              id="signup-confirm-password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={registering || !emailForm.name || !emailForm.email || !emailForm.password || !emailForm.confirmPassword}
          className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm
            hover:shadow-glow transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2 active:scale-[0.99]"
          id="email-signup-btn"
        >
          {registering ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-xs text-dark-500 text-center">
        Your password is securely encrypted and never stored in plain text
      </p>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5 animate-fade-in">
      {/* User badge */}
      {googleUser && (
        <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-500/30 flex items-center gap-3">
          {googleUser.avatarUrl ? (
            <img src={googleUser.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
              {(googleUser.name || googleUser.email)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-dark-100 truncate">{googleUser.name}</p>
            <p className="text-xs text-dark-400 truncate">{googleUser.email}</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        </div>
      )}

      {/* Institution type selector */}
      <div>
        <p className="text-sm font-medium text-dark-200 mb-3">Where do you study?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setInstType('college'); setInstitution(null); setSearchQuery(''); setSearchResults([]) }}
            className={`p-4 rounded-xl border text-center transition-all duration-200 group
              ${instType === 'college'
                ? 'border-brand-500/60 bg-brand-500/10 shadow-glow'
                : 'border-dark-500/30 bg-dark-700/40 hover:border-dark-400/50 hover:bg-dark-700/60'
              }`}
          >
            <GraduationCap className={`w-6 h-6 mx-auto mb-2 transition-colors ${instType === 'college' ? 'text-brand-400' : 'text-dark-400 group-hover:text-dark-300'}`} />
            <span className={`text-sm font-medium ${instType === 'college' ? 'text-brand-300' : 'text-dark-300'}`}>College</span>
          </button>
          <button
            onClick={() => { setInstType('school'); setInstitution(null); setSearchQuery(''); setSearchResults([]) }}
            className={`p-4 rounded-xl border text-center transition-all duration-200 group
              ${instType === 'school'
                ? 'border-brand-500/60 bg-brand-500/10 shadow-glow'
                : 'border-dark-500/30 bg-dark-700/40 hover:border-dark-400/50 hover:bg-dark-700/60'
              }`}
          >
            <BookOpen className={`w-6 h-6 mx-auto mb-2 transition-colors ${instType === 'school' ? 'text-brand-400' : 'text-dark-400 group-hover:text-dark-300'}`} />
            <span className={`text-sm font-medium ${instType === 'school' ? 'text-brand-300' : 'text-dark-300'}`}>School</span>
          </button>
        </div>
      </div>

      {/* Search / Code toggle */}
      {instType && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-700/60 border border-dark-500/20 mb-3">
            <button
              onClick={() => { setSearchMode('search'); setError(''); clearInstitution() }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all
                ${searchMode === 'search' ? 'bg-dark-600 text-dark-50 shadow-sm' : 'text-dark-400 hover:text-dark-300'}`}
            >
              <Search className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Search by Name
            </button>
            <button
              onClick={() => { setSearchMode('code'); setError(''); clearInstitution() }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all
                ${searchMode === 'code' ? 'bg-dark-600 text-dark-50 shadow-sm' : 'text-dark-400 hover:text-dark-300'}`}
            >
              <Hash className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Enter Code
            </button>
          </div>

          {/* SEARCH MODE */}
          {searchMode === 'search' && !institution && (
            <div className="relative">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder={`Search your ${instType}...`}
                  className="input-base pl-10 pr-10"
                  id="institution-search-input"
                  autoComplete="off"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 animate-spin" />}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div ref={dropdownRef}
                  className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto rounded-xl border border-dark-500/40 bg-dark-800/95 backdrop-blur-xl shadow-elevated animate-scale-in">
                  {searchResults.map((inst) => (
                    <button key={inst.id} onClick={() => selectInstitution(inst)}
                      className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-dark-700/60 transition-colors border-b border-dark-500/15 last:border-0">
                      <Building2 className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dark-100 line-clamp-1">{inst.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {inst.city && <span className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{inst.city}</span>}
                          <span className="text-xs text-dark-500 capitalize">• {inst.type}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                <div className="absolute z-50 w-full mt-2 px-4 py-6 text-center rounded-xl border border-dark-500/40 bg-dark-800/95 backdrop-blur-xl shadow-elevated">
                  <p className="text-sm text-dark-400">No {instType}s found matching "{searchQuery}"</p>
                  <button onClick={() => { setSearchMode('code'); setShowDropdown(false) }}
                    className="text-xs text-brand-400 hover:text-brand-300 mt-2 underline">
                    Try entering the code instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CODE MODE */}
          {searchMode === 'code' && !institution && (
            <div className="space-y-3">
              <input
                type="text" value={institutionCode}
                onChange={e => { setInstitutionCode(e.target.value); setError('') }}
                placeholder="Enter institution code"
                className="input-base text-center tracking-wider font-mono"
                id="institution-code-input"
                onKeyDown={e => e.key === 'Enter' && validateCode()}
              />
              <button onClick={validateCode} disabled={validating || !institutionCode.trim()}
                className="w-full py-3 rounded-xl gradient-brand text-white font-semibold text-sm hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                id="validate-code-btn">
                {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <>Verify Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* Selected institution card */}
          {institution && (
            <div className="p-4 rounded-xl bg-success/8 border border-success/20 animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-dark-50 line-clamp-2">{institution.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {institution.city && <span className="text-xs text-dark-300 flex items-center gap-1"><MapPin className="w-3 h-3" />{institution.city}</span>}
                    <span className="text-xs text-dark-400 capitalize">• {institution.type}</span>
                  </div>
                </div>
                <button onClick={clearInstitution} className="p-1 rounded-lg hover:bg-dark-700/60 text-dark-400 hover:text-dark-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Continue button */}
      {institution && (
        <button onClick={goToConfirm}
          className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:shadow-glow transition-all duration-200 flex items-center justify-center gap-2 animate-fade-in">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-dark-50">Confirm your details</h2>
        <p className="text-sm text-dark-400 mt-1">Review and complete your signup</p>
      </div>

      {/* Account info */}
      {googleUser && (
        <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-500/30">
          <p className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-3">Account</p>
          <div className="flex items-center gap-3">
            {googleUser.avatarUrl ? (
              <img src={googleUser.avatarUrl} alt="" className="w-11 h-11 rounded-full ring-2 ring-brand-500/30" />
            ) : (
              <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                {(googleUser.name || googleUser.email)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-dark-50">{googleUser.name}</p>
              <p className="text-xs text-dark-400">{googleUser.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {googleUser.authProvider === 'local' ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/12 text-violet-400 border border-violet-500/20">Email</span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/12 text-blue-400 border border-blue-500/20">Google</span>
              )}
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
      )}

      {/* Institution */}
      {institution && (
        <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-500/30">
          <p className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-3">Institution</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center">
              {institution.type === 'college' ? (
                <GraduationCap className="w-5 h-5 text-brand-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-brand-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-50 line-clamp-1">{institution.name}</p>
              <p className="text-xs text-dark-400 capitalize">{institution.city ? `${institution.city} • ` : ''}{institution.type}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-success ml-auto shrink-0" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-1">
        <button onClick={handleSignup} disabled={submitting}
          className="w-full py-4 rounded-xl gradient-brand text-white font-semibold text-sm hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
          id="complete-signup-btn">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : <>Complete Signup <CheckCircle2 className="w-4 h-4" /></>}
        </button>
        <button onClick={() => setStep(2)} className="w-full py-2.5 text-sm text-dark-400 hover:text-dark-200 transition-colors">
          ← Back to institution selection
        </button>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-15" />
      <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[160px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 -left-40 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[160px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md mx-4 animate-slide-up">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="rounded-2xl border border-dark-500/30 bg-dark-800/80 backdrop-blur-xl shadow-elevated overflow-hidden">
          <div className="h-1 gradient-brand" />

          <div className="p-8">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
                <School className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold font-heading text-dark-50">Join Skolar</h1>
                <p className="text-sm text-dark-400 mt-1">Create your account in a few easy steps</p>
              </div>
            </div>

            {/* Step indicators */}
            {(() => {
              const steps = step === 4
                ? [{ num: 1, label: 'Account' }, { num: 2, label: 'Institution' }, { num: 3, label: 'Confirm' }, { num: 4, label: 'Password' }]
                : [{ num: 1, label: 'Account' }, { num: 2, label: 'Institution' }, { num: 3, label: 'Confirm' }]
              return (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {steps.map((s, i) => (
                    <div key={s.num} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                          ${step > s.num
                            ? 'gradient-brand text-white shadow-glow'
                            : step === s.num
                            ? 'gradient-brand text-white shadow-glow animate-pulse-soft'
                            : 'bg-dark-700 text-dark-400 border border-dark-500/30'
                          }`}>
                          {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                        </div>
                        <span className={`text-[10px] font-medium ${step >= s.num ? 'text-dark-200' : 'text-dark-500'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-8 h-0.5 rounded-full transition-all duration-300 mb-4
                          ${step > s.num ? 'bg-brand-500' : 'bg-dark-600'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger text-center animate-scale-in">
                {error}
              </div>
            )}

            {/* Step content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-success/12 mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-lg font-semibold text-dark-50">Account Created!</h2>
                  <p className="text-sm text-dark-400 mt-1">Set a password so you can also sign in with email</p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div>
                    <label className="text-sm text-dark-300 mb-1.5 block font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                        placeholder="Min 6 characters"
                        className="input-base pl-10 pr-10"
                        id="set-password-input"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-dark-300 mb-1.5 block font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => { setConfirmNewPassword(e.target.value); setError('') }}
                        placeholder="Re-enter your password"
                        className="input-base pl-10"
                        id="set-password-confirm"
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-danger">Passwords do not match</p>
                  )}

                  <button
                    type="submit"
                    disabled={settingPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                    className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm
                      hover:shadow-glow transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2 active:scale-[0.99]"
                    id="set-password-btn"
                  >
                    {settingPassword ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Setting password...</>
                    ) : (
                      <>Set Password <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <button
                  onClick={skipPassword}
                  className="w-full py-2.5 text-sm text-dark-400 hover:text-dark-200 transition-colors"
                >
                  Skip for now →
                </button>

                <p className="text-xs text-dark-500 text-center">
                  You can always add or change your password later in Settings
                </p>
              </div>
            )}

            {/* Login link — hide on Step 4 (password setup) */}
            {step !== 4 && (
              <>
                <div className="flex items-center gap-3 mt-8">
                  <div className="flex-1 h-px bg-dark-500/30" />
                  <span className="text-xs text-dark-500 font-medium">Already have an account?</span>
                  <div className="flex-1 h-px bg-dark-500/30" />
                </div>

                <Link to="/login"
                  className="mt-4 w-full flex items-center justify-center px-6 py-3 rounded-xl border border-dark-500/40 text-dark-200 font-medium text-sm hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-dark-50 transition-all duration-200">
                  Sign in instead
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-dark-500 mt-6">
          By creating an account, you agree to Skolar's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
