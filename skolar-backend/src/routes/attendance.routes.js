import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { markAttendance, getStudentAttendance, getClassAttendance, getAttendanceReport } from '../controllers/attendance.controller.js'

const router = Router()
router.use(authMiddleware)

router.post('/mark', markAttendance)
router.get('/student/:studentId', getStudentAttendance)
router.get('/class/:sectionId/:subjectId', getClassAttendance)
router.get('/report/:institutionId', getAttendanceReport)

export default router
