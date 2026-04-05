import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getDeanOverview, getDeanDepartments, getDeanStaff,
  getDeanStudents, getDeanReports, getDeanAttendance,
  getDeanSubjects, deanAssignTeacher,
} from '../controllers/dean.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('dean'))

/**
 * All dean endpoints already filter by getDeanDeptIds(userId)
 * which only returns departments where deanId === user.id.
 * This is defense-in-depth at the controller level.
 */
router.get('/overview', getDeanOverview)
router.get('/departments', getDeanDepartments)
router.get('/staff', getDeanStaff)
router.get('/students', getDeanStudents)
router.get('/attendance', getDeanAttendance)
router.get('/subjects', getDeanSubjects)
router.get('/reports', getDeanReports)

// Write — controller validates subject belongs to dean's managed depts
router.post('/assign-teacher', deanAssignTeacher)

export default router
