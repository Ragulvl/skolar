import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../../config/prisma.js'
import { JWT_SECRET, BCRYPT_ROUNDS, generateToken, setTokenCookie, getDashboardPath } from './utils.js'

// POST /api/auth/register — email/password step 1 (returns temp token)
export async function register(req, res) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const tempToken = jwt.sign(
      { email: email.toLowerCase().trim(), name: name.trim(), passwordHash, authProvider: 'local' },
      JWT_SECRET, { expiresIn: '15m' }
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

    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' })

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'This account uses Google sign-in. Please sign in with Google, or add a password in your Settings.',
        code: 'GOOGLE_ONLY',
      })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid email or password' })

    const token = generateToken(user.id)
    setTokenCookie(res, token)

    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, dashboardPath: getDashboardPath(user) },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Failed to sign in' })
  }
}

// POST /api/auth/set-password — add password to Google-only account
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
    await prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash, authProvider: 'both' } })

    res.json({ success: true, data: { message: 'Password set successfully. You can now sign in with email and password.' } })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' })
    }
    console.error('Set password error:', error)
    res.status(500).json({ success: false, error: 'Failed to set password' })
  }
}
