import { Router } from 'express'
import passport from '../config/passport.config.js'
import { googleCallback, getMe, signup, logout, validateInstitutionCode, searchInstitutions } from '../controllers/auth.controller.js'

const router = Router()

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}))

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  googleCallback
)

// Get current user
router.get('/me', getMe)

// Search institutions by name
router.get('/search-institutions', searchInstitutions)

// Sign up with institution code
router.post('/signup', signup)

// Validate institution code
router.post('/validate-code', validateInstitutionCode)

// Logout
router.post('/logout', logout)

export default router
