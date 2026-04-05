import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createAssessment, getAssessmentsBySubject, submitAssessment, getStudentResults, getAssessmentReport } from '../controllers/assessment.controller.js'

const router = Router()
router.use(authMiddleware)

router.post('/create', createAssessment)
router.get('/subject/:subjectId', getAssessmentsBySubject)
router.post('/submit', submitAssessment)
router.get('/results/:studentId', getStudentResults)
router.get('/report/:assessmentId', getAssessmentReport)

export default router
