import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'skolar-dev-secret'
const JWT_EXPIRES_IN = '7d'

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function getDashboardPath(user) {
  const { role } = user
  // Derive institution type from FK chain (user.institution.type)
  const institutionType = user.institution?.type

  if (role === 'superadmin') return '/dashboard/superadmin'
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'pending') return '/pending'

  // Roles that exist in both school and college
  const dualRoles = ['principal', 'vice_principal', 'teacher', 'student']
  if (dualRoles.includes(role)) {
    const type = institutionType || 'school'
    const rolePath = role.replace(/_/g, '-')
    return `/dashboard/${type}/${rolePath}`
  }

  // College-only roles
  const collegeRoles = ['chairman', 'vice_chairman', 'dean', 'hod']
  if (collegeRoles.includes(role)) {
    const rolePath = role.replace(/_/g, '-')
    return `/dashboard/college/${rolePath}`
  }

  return '/pending'
}

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

    res.cookie('skolar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    })

    const dashboardPath = getDashboardPath(user)
    return res.redirect(`${process.env.FRONTEND_URL}${dashboardPath}`)
  } catch (error) {
    console.error('Google callback error:', error)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}

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

// POST /api/auth/signup — sign up with institution code after Google auth
export async function signup(req, res) {
  try {
    const { token, institutionCode } = req.body

    if (!token || !institutionCode) {
      return res.status(400).json({ success: false, error: 'Token and institution code are required' })
    }

    // Verify the temp token from Google OAuth
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid or expired signup token. Please sign in with Google again.' })
    }

    const { googleId, email, name, avatarUrl } = decoded

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please login instead.' })
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
    const user = await prisma.user.create({
      data: {
        name,
        email,
        googleId,
        avatarUrl,
        role: 'pending',
        institutionId: institution.id,
        isApproved: false,
      },
    })

    // Generate session token
    const sessionToken = generateToken(user.id)
    res.cookie('skolar_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

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
