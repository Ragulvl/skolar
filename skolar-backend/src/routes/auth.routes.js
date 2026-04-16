import { Router } from 'express'
import passport from '../config/passport.config.js'
import {
  googleCallback, getMe, signup, logout,
  validateInstitutionCode, searchInstitutions,
  register, loginWithPassword, setPassword,
} from '../controllers/auth/index.js'

const router = Router()

// ─── Google OAuth ──────────────────────────
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}))

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  googleCallback
)

// ─── Email/Password Auth ───────────────────
router.post('/register', register)
router.post('/login', loginWithPassword)
router.post('/set-password', setPassword)

// ─── Common ────────────────────────────────
router.get('/me', getMe)
router.get('/search-institutions', searchInstitutions)
router.post('/signup', signup)
router.post('/validate-code', validateInstitutionCode)
router.post('/logout', logout)

export default router
