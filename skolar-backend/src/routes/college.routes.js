import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import { getDepartments, createDepartment, assignHOD, assignTeacher, getStudents } from '../controllers/college.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('chairman', 'vice_chairman', 'principal', 'vice_principal', 'dean', 'hod', 'admin'))

router.get('/departments/:institutionId', getDepartments)
router.post('/departments', createDepartment)
router.post('/assign-hod', assignHOD)
router.post('/assign-teacher', assignTeacher)
router.get('/students/:deptId', getStudents)

export default router
