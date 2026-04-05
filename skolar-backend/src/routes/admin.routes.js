import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import { getMyInstitutions, getInstitutionStats, getPendingUsers, approveUser } from '../controllers/admin.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('admin'))

router.get('/institutions', getMyInstitutions)
router.get('/institutions/:id/stats', getInstitutionStats)
router.get('/pending/:institutionId', getPendingUsers)
router.patch('/approve-user', approveUser)

export default router
