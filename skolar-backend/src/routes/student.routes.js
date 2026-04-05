import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getStudentDashboard, getStudentOwnAttendance, getStudentAssessments,
  getStudentSubjects, getStudentCertificates, getStudentGrades,
} from '../controllers/student.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('student'))

/**
 * All student endpoints use req.user.id internally.
 * Students can ONLY access their own data.
 * No :studentId param needed — identity comes from JWT.
 */
router.get('/dashboard', getStudentDashboard)
router.get('/attendance', getStudentOwnAttendance)
router.get('/assessments', getStudentAssessments)
router.get('/subjects', getStudentSubjects)
router.get('/certificates', getStudentCertificates)
router.get('/grades', getStudentGrades)

export default router
