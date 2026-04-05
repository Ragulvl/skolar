import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from './prisma.js'

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value
    const googleId = profile.id
    const name = profile.displayName || email?.split('@')[0] || 'User'
    const avatarUrl = profile.photos?.[0]?.value || null

    // 1. Check if user exists by googleId (direct match)
    let user = await prisma.user.findUnique({ where: { googleId } })

    if (user) {
      // Update avatar if missing
      if (!user.avatarUrl && avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        })
      }
      return done(null, user)
    }

    // 2. No googleId match — check by email (account linking scenario)
    user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Existing email/password user signing in with Google for the first time
      // Auto-link: Google guarantees email ownership, so this is safe
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          name: user.name || name,
          authProvider: user.passwordHash ? 'both' : 'google',
          emailVerified: true, // Google guarantees email
        },
      })
      return done(null, user)
    }

    // 3. New user — check if first user (superadmin)
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          avatarUrl,
          role: 'superadmin',
          isApproved: true,
          authProvider: 'google',
          emailVerified: true,
        },
      })
      return done(null, user)
    }

    // 4. Otherwise, return profile info for frontend signup flow
    return done(null, {
      isNewUser: true,
      googleId,
      email,
      name,
      avatarUrl,
    })
  } catch (error) {
    console.error('Google OAuth error:', error)
    return done(error, null)
  }
}))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

export default passport
