import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import { isOwnStudentData, isTeacherOfSubject } from '../middleware/access.middleware.js'
import { markAttendance, getStudentAttendance, getClassAttendance, getAttendanceReport, getMyAssignments } from '../controllers/attendance.controller.js'

const router = Router()
router.use(authMiddleware)

// Teacher marks attendance — middleware validates they're assigned to the subject
router.post('/mark', allowRoles('teacher', 'hod', 'dean'), markAttendance)

// Teacher gets own subject assignments
router.get('/my-assignments', allowRoles('teacher'), getMyAssignments)

// Student attendance — isOwnStudentData blocks access to other students
router.get('/student/:studentId', isOwnStudentData(), getStudentAttendance)

// Class attendance — for teachers/HODs
router.get('/class/:sectionId/:subjectId', allowRoles('teacher', 'hod', 'dean', 'principal', 'chairman', 'vice_chairman', 'vice_principal'), getClassAttendance)

// Report — institution-level
router.get('/report/:institutionId', allowRoles('principal', 'chairman', 'vice_chairman', 'vice_principal', 'admin', 'superadmin'), getAttendanceReport)

export default router
