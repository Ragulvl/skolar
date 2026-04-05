import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'skolar-dev-secret'
const JWT_EXPIRES_IN = '7d'
const BCRYPT_ROUNDS = 12

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function setTokenCookie(res, token) {
  res.cookie('skolar_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  })
}

function getDashboardPath(user) {
  const { role } = user
  const institutionType = user.institution?.type

  if (role === 'superadmin') return '/dashboard/superadmin'
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'pending') return '/pending'

  const dualRoles = ['principal', 'vice_principal', 'teacher', 'student']
  if (dualRoles.includes(role)) {
    const type = institutionType || 'school'
    const rolePath = role.replace(/_/g, '-')
    return `/dashboard/${type}/${rolePath}`
  }

  const collegeRoles = ['chairman', 'vice_chairman', 'dean', 'hod']
  if (collegeRoles.includes(role)) {
    const rolePath = role.replace(/_/g, '-')
    return `/dashboard/college/${rolePath}`
  }

  return '/pending'
}

// ──────────────────────────────────────────────
// GOOGLE OAUTH
// ──────────────────────────────────────────────

// Called by Passport after Google OAuth callback
export async function googleCallback(req, res) {
  try {
    const user = req.user

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`)
    }

    // New user — redirect to signup with Google info encoded in a temp token
    if (user.isNewUser) {
      const tempToken = jwt.sign(
        {
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      )
      return res.redirect(`${process.env.FRONTEND_URL}/signup?token=${tempToken}`)
    }

    // Existing user — generate session token and redirect to dashboard
    const token = generateToken(user.id)
    setTokenCookie(res, token)

    const dashboardPath = getDashboardPath(user)
    return res.redirect(`${process.env.FRONTEND_URL}${dashboardPath}`)
  } catch (error) {
    console.error('Google callback error:', error)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}

// ──────────────────────────────────────────────
// EMAIL / PASSWORD AUTH
// ──────────────────────────────────────────────

// POST /api/auth/register — email/password signup (step 1: creates temp token, step 2 uses /signup)
export async function register(req, res) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (existing) {
      if (existing.googleId && !existing.passwordHash) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists via Google. Sign in with Google, then add a password in Settings.',
          code: 'GOOGLE_ACCOUNT_EXISTS',
        })
      }
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in.' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Create a temp token with credentials (like Google OAuth flow)
    // The actual user is created in /signup with institution code
    const tempToken = jwt.sign(
      {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        authProvider: 'local',
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.json({ success: true, data: { token: tempToken } })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: 'Failed to register' })
  }
}

// POST /api/auth/login — email/password login
export async function loginWithPassword(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { institution: { select: { type: true } } },
    })

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'This account uses Google sign-in. Please sign in with Google, or add a password in your Settings.',
        code: 'GOOGLE_ONLY',
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    // Generate session token
    const token = generateToken(user.id)
    setTokenCookie(res, token)

    const dashboardPath = getDashboardPath(user)

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dashboardPath,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Failed to sign in' })
  }
}

// POST /api/auth/set-password — add password to Google-only account (authenticated)
export async function setPassword(req, res) {
  try {
    const token = req.cookies?.skolar_token
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' })

    const decoded = jwt.verify(token, JWT_SECRET)
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        passwordHash,
        authProvider: 'both',
      },
    })

    res.json({ success: true, data: { message: 'Password set successfully. You can now sign in with email and password.' } })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' })
    }
    console.error('Set password error:', error)
    res.status(500).json({ success: false, error: 'Failed to set password' })
  }
}

// ──────────────────────────────────────────────
// EXISTING ENDPOINTS (enhanced)
// ──────────────────────────────────────────────

// GET /api/auth/me — return current user from JWT cookie
export async function getMe(req, res) {
  try {
    const token = req.cookies?.skolar_token
    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        institutionId: true,
        isApproved: true,
        gradeId: true,
        sectionId: true,
        departmentId: true,
        authProvider: true,
        emailVerified: true,
        institution: { select: { id: true, name: true, type: true, code: true } },
      },
    })

    if (!user) {
      res.clearCookie('skolar_token')
      return res.status(401).json({ success: false, error: 'User not found' })
    }

    res.json({ success: true, data: { ...user, dashboardPath: getDashboardPath(user) } })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie('skolar_token')
      return res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
    console.error('getMe error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

// POST /api/auth/signup — sign up with institution code (works for BOTH Google and email/password flows)
export async function signup(req, res) {
  try {
    const { token, institutionCode } = req.body

    if (!token || !institutionCode) {
      return res.status(400).json({ success: false, error: 'Token and institution code are required' })
    }

    // Verify the temp token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid or expired signup token. Please start over.' })
    }

    const { googleId, email, name, avatarUrl, passwordHash, authProvider } = decoded

    // Check if user already exists
    const existingWhere = googleId ? { OR: [{ googleId }, { email }] } : { email }
    const existing = await prisma.user.findFirst({ where: existingWhere })
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in instead.' })
    }

    // Validate institution code
    const institution = await prisma.institution.findUnique({
      where: { code: institutionCode },
    })
    if (!institution) {
      return res.status(404).json({ success: false, error: 'Invalid institution code. Please check and try again.' })
    }
    if (!institution.isActive) {
      return res.status(400).json({ success: false, error: 'This institution is currently inactive.' })
    }

    // Create user as pending
    const userData = {
      name,
      email,
      role: 'pending',
      institutionId: institution.id,
      isApproved: false,
    }

    // Set auth-specific fields
    if (authProvider === 'local') {
      // Email/password signup
      userData.passwordHash = passwordHash
      userData.authProvider = 'local'
      userData.emailVerified = false
    } else {
      // Google OAuth signup
      userData.googleId = googleId
      userData.avatarUrl = avatarUrl
      userData.authProvider = 'google'
      userData.emailVerified = true // Google guarantees email ownership
    }

    const user = await prisma.user.create({ data: userData })

    // Generate session token
    const sessionToken = generateToken(user.id)
    setTokenCookie(res, sessionToken)

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: { name: institution.name, type: institution.type },
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, error: 'Failed to create account' })
  }
}

// POST /api/auth/validate-code — validate institution code
export async function validateInstitutionCode(req, res) {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({ success: false, error: 'Institution code is required' })
    }

    const institution = await prisma.institution.findUnique({
      where: { code },
      select: { id: true, name: true, type: true, code: true, city: true, isActive: true },
    })

    if (!institution) {
      return res.status(404).json({ success: false, error: 'Invalid institution code' })
    }
    if (!institution.isActive) {
      return res.status(400).json({ success: false, error: 'This institution is inactive' })
    }

    res.json({ success: true, data: institution })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate code' })
  }
}

// GET /api/auth/search-institutions?q=PSG&type=college
export async function searchInstitutions(req, res) {
  try {
    const { q, type } = req.query
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] })
    }

    const where = {
      name: { contains: q.trim(), mode: 'insensitive' },
      isActive: true,
    }
    if (type && (type === 'school' || type === 'college')) {
      where.type = type
    }

    const institutions = await prisma.institution.findMany({
      where,
      select: { id: true, name: true, type: true, code: true, city: true },
      take: 10,
      orderBy: { name: 'asc' },
    })

    res.json({ success: true, data: institutions })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search institutions' })
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie('skolar_token', { path: '/' })
  res.json({ success: true, data: { message: 'Logged out successfully' } })
}
