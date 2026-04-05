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

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    })

    if (user) {
      // Update googleId and avatar if not set
      if (!user.googleId || !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            avatarUrl: user.avatarUrl || avatarUrl,
            name: user.name || name,
          },
        })
      }
      return done(null, user)
    }

    // New user — check if this is the first user (make them superadmin)
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
        },
      })
      return done(null, user)
    }

    // Otherwise, return the profile info for the frontend to handle signup
    // Don't auto-create — let the signup flow handle it with institution code
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
