import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { issueCertificate, getStudentCertificates } from '../controllers/certificate.controller.js'

const router = Router()
router.use(authMiddleware)

router.post('/issue', issueCertificate)
router.get('/:studentId', getStudentCertificates)

export default router
