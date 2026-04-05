import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'skolar-dev-secret'

// In-memory user cache — avoids hitting DB on every single API request.
// TTL: 60 seconds. For the Super Admin overview page alone, this turns
// 3 user lookups (one per parallel API call) into 1.
const userCache = new Map()
const CACHE_TTL = 60_000 // 60 seconds

function getCachedUser(userId) {
  const entry = userCache.get(userId)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    userCache.delete(userId)
    return null
  }
  return entry.user
}

/**
 * Auth middleware — verifies JWT from httpOnly cookie.
 * Attaches user object to req.user (cached for 60s)
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.skolar_token

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Check cache first
    let user = getCachedUser(decoded.userId)

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
          isApproved: true,
          gradeId: true,
          sectionId: true,
          departmentId: true,
          institution: { select: { type: true } },
        },
      })

      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' })
      }

      userCache.set(decoded.userId, { user, ts: Date.now() })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
    console.error('Auth middleware error:', error)
    return res.status(500).json({ success: false, error: 'Authentication error' })
  }
}

// Export for cache invalidation when user data changes (role update, approval toggle, etc.)
export function invalidateUserCache(userId) {
  if (userId) userCache.delete(userId)
  else userCache.clear()
}
