import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const JWT_SECRET = process.env.JWT_SECRET || 'skolar-dev-secret'
export const JWT_EXPIRES_IN = '7d'
export const BCRYPT_ROUNDS = 12

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function setTokenCookie(res, token) {
  res.cookie('skolar_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function getDashboardPath(user) {
  const { role } = user
  const institutionType = user.institution?.type

  if (role === 'superadmin') return '/dashboard/superadmin'
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'pending') return '/pending'

  const dualRoles = ['principal', 'vice_principal', 'teacher', 'student']
  if (dualRoles.includes(role)) {
    const type = institutionType || 'school'
    return `/dashboard/${type}/${role.replace(/_/g, '-')}`
  }

  const collegeRoles = ['chairman', 'vice_chairman', 'dean', 'hod']
  if (collegeRoles.includes(role)) {
    return `/dashboard/college/${role.replace(/_/g, '-')}`
  }

  return '/pending'
}
