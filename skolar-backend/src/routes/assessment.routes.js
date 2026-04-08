import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  createAssessment, getMyAssessments, getAssessmentDetail,
  getAssessableSubjects, getStudentPendingAssessments,
  getAssessmentForStudent, submitAssessment,
  getAssessmentsBySubject, getStudentResults, getAssessmentReport,
} from '../controllers/assessment.controller.js'

const router = Router()
router.use(authMiddleware)

// Teacher/HOD/Dean — create + view assessments
router.get('/my', allowRoles('teacher', 'hod', 'dean'), getMyAssessments)
router.get('/subjects', allowRoles('teacher', 'hod', 'dean'), getAssessableSubjects)
router.post('/create', allowRoles('teacher', 'hod', 'dean'), createAssessment)
router.get('/detail/:assessmentId', allowRoles('teacher', 'hod', 'dean'), getAssessmentDetail)
router.get('/report/:assessmentId', allowRoles('teacher', 'hod', 'dean', 'chairman', 'principal'), getAssessmentReport)

// Student — pending/completed + take + submit
router.get('/pending', allowRoles('student'), getStudentPendingAssessments)
router.get('/take/:assessmentId', allowRoles('student'), getAssessmentForStudent)
router.post('/submit', allowRoles('student'), submitAssessment)

// Generic
router.get('/subject/:subjectId', getAssessmentsBySubject)
router.get('/results/:studentId', getStudentResults)

export default router
