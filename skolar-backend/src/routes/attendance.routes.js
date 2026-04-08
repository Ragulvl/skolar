import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import { isOwnStudentData } from '../middleware/access.middleware.js'
import { markAttendance, getStudentAttendance, getClassAttendance, getAttendanceReport, getMyAssignments, getMarkableStudents } from '../controllers/attendance.controller.js'

const router = Router()
router.use(authMiddleware)

// Teacher/HOD marks attendance
router.post('/mark', allowRoles('teacher', 'hod'), markAttendance)

// Get students for marking attendance (by subject)
router.get('/markable-students/:subjectId', allowRoles('teacher', 'hod'), getMarkableStudents)

// Teacher gets own subject assignments
router.get('/my-assignments', allowRoles('teacher', 'hod'), getMyAssignments)

// Student attendance — isOwnStudentData blocks access to other students
router.get('/student/:studentId', isOwnStudentData(), getStudentAttendance)

// Class attendance
router.get('/class/:sectionId/:subjectId', allowRoles('teacher', 'hod', 'dean', 'principal', 'chairman', 'vice_chairman', 'vice_principal'), getClassAttendance)

// Report
router.get('/report/:institutionId', allowRoles('principal', 'chairman', 'vice_chairman', 'vice_principal', 'admin', 'superadmin'), getAttendanceReport)

export default router
