import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma.js'
import { JWT_SECRET, generateToken, setTokenCookie, getDashboardPath } from './utils.js'

// GET /api/auth/me
export async function getMe(req, res) {
  try {
    const token = req.cookies?.skolar_token
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' })

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true,
        institutionId: true, isApproved: true, gradeId: true, sectionId: true,
        departmentId: true, authProvider: true, emailVerified: true,
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

// POST /api/auth/signup — create account with institution code (Google + email/password flows)
export async function signup(req, res) {
  try {
    const { token, institutionCode } = req.body
    if (!token || !institutionCode) {
      return res.status(400).json({ success: false, error: 'Token and institution code are required' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid or expired signup token. Please start over.' })
    }

    const { googleId, email, name, avatarUrl, passwordHash, authProvider } = decoded

    const existingWhere = googleId ? { OR: [{ googleId }, { email }] } : { email }
    const existing = await prisma.user.findFirst({ where: existingWhere })
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in instead.' })
    }

    const institution = await prisma.institution.findUnique({ where: { code: institutionCode } })
    if (!institution) return res.status(404).json({ success: false, error: 'Invalid institution code. Please check and try again.' })
    if (!institution.isActive) return res.status(400).json({ success: false, error: 'This institution is currently inactive.' })

    const userData = { name, email, role: 'pending', institutionId: institution.id, isApproved: false }

    if (authProvider === 'local') {
      userData.passwordHash = passwordHash
      userData.authProvider = 'local'
      userData.emailVerified = false
    } else {
      userData.googleId = googleId
      userData.avatarUrl = avatarUrl
      userData.authProvider = 'google'
      userData.emailVerified = true
    }

    const user = await prisma.user.create({ data: userData })
    const sessionToken = generateToken(user.id)
    setTokenCookie(res, sessionToken)

    res.status(201).json({
      success: true,
      data: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        institution: { name: institution.name, type: institution.type },
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, error: 'Failed to create account' })
  }
}

// POST /api/auth/validate-code
export async function validateInstitutionCode(req, res) {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ success: false, error: 'Institution code is required' })

    const institution = await prisma.institution.findUnique({
      where: { code },
      select: { id: true, name: true, type: true, code: true, city: true, isActive: true },
    })
    if (!institution) return res.status(404).json({ success: false, error: 'Invalid institution code' })
    if (!institution.isActive) return res.status(400).json({ success: false, error: 'This institution is inactive' })

    res.json({ success: true, data: institution })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate code' })
  }
}

// GET /api/auth/search-institutions
export async function searchInstitutions(req, res) {
  try {
    const { q, type } = req.query
    if (!q || q.trim().length < 2) return res.json({ success: true, data: [] })

    const where = { name: { contains: q.trim(), mode: 'insensitive' }, isActive: true }
    if (type === 'school' || type === 'college') where.type = type

    const institutions = await prisma.institution.findMany({
      where, select: { id: true, name: true, type: true, code: true, city: true },
      take: 10, orderBy: { name: 'asc' },
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
