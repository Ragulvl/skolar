import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getAdminOverview, getMyInstitutions, getInstitutionStats,
  getPendingUsers, getAllPendingUsers, approveUser, rejectUser,
  getAdminReports,
} from '../controllers/admin.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('admin'))

router.get('/overview', getAdminOverview)
router.get('/institutions', getMyInstitutions)
router.get('/institutions/:id/stats', getInstitutionStats)
router.get('/pending/:institutionId', getPendingUsers)
router.get('/all-pending', getAllPendingUsers)
router.patch('/approve-user', approveUser)
router.patch('/reject-user', rejectUser)
router.get('/reports/:institutionId', getAdminReports)

export default router
