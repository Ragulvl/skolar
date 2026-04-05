import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getGrades, getSections, createSection,
  getSubjects, createSubject, assignTeacher, reassignTeacher, getStudents,
  getTeachersByInstitution, getStudentsByInstitution
} from '../controllers/school.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('principal', 'vice_principal', 'teacher', 'admin', 'student'))

router.get('/grades/:institutionId', getGrades)
router.get('/sections/:gradeId', getSections)
router.post('/sections', createSection)
router.get('/subjects/:gradeId', getSubjects)
router.post('/subjects', createSubject)
router.post('/assign-teacher', assignTeacher)
router.patch('/reassign-teacher', reassignTeacher)
router.get('/students/:sectionId', getStudents)
router.get('/teachers-by-institution/:institutionId', getTeachersByInstitution)
router.get('/students-by-institution/:institutionId', getStudentsByInstitution)

export default router

