import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getVPOverview, getVPGrades, getVPDepartments,
  getVPTeachers, getVPStudents, getVPAttendance, getVPReports,
} from '../controllers/viceprincipal.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('vice_principal'))

router.get('/overview', getVPOverview)
router.get('/grades', getVPGrades)
router.get('/departments', getVPDepartments)
router.get('/teachers', getVPTeachers)
router.get('/students', getVPStudents)
router.get('/attendance', getVPAttendance)
router.get('/reports', getVPReports)

export default router
