import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getHODOverview, getHODTeachers, getHODSubjects, getHODStudents,
  getHODAttendance, getHODAssessments, getHODReports,
  assignSubjectToTeacher, removeAssignment, createHODSubject,
  getAvailableTeachers,
} from '../controllers/hod.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('hod'))

router.get('/overview', getHODOverview)
router.get('/teachers', getHODTeachers)
router.get('/subjects', getHODSubjects)
router.get('/students', getHODStudents)
router.get('/attendance', getHODAttendance)
router.get('/assessments', getHODAssessments)
router.get('/reports', getHODReports)
router.get('/available-teachers', getAvailableTeachers)

router.post('/subjects', createHODSubject)
router.post('/assign-subject', assignSubjectToTeacher)
router.delete('/assignments/:id', removeAssignment)

export default router
