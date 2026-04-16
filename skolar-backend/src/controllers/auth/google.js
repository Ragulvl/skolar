import jwt from 'jsonwebtoken'
import { JWT_SECRET, generateToken, setTokenCookie, getDashboardPath } from './utils.js'

// POST /api/auth/google/callback (called by Passport after Google OAuth)
export async function googleCallback(req, res) {
  try {
    const user = req.user
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`)

    // New user — redirect to signup with temp token
    if (user.isNewUser) {
      const tempToken = jwt.sign(
        { googleId: user.googleId, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
        JWT_SECRET,
        { expiresIn: '15m' }
      )
      return res.redirect(`${process.env.FRONTEND_URL}/signup?token=${tempToken}`)
    }

    const token = generateToken(user.id)
    setTokenCookie(res, token)
    return res.redirect(`${process.env.FRONTEND_URL}${getDashboardPath(user)}`)
  } catch (error) {
    console.error('Google callback error:', error)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}
