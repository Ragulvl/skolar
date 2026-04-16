import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getAdminOverview, getMyInstitutions, getInstitutionStats,
  getPendingUsers, getAllPendingUsers, approveUser, rejectUser,
  getAdminReports,
  getAdminUsers, getAdminUserById, getAdminAnalytics, getAdminInstitutionDetail,
} from '../controllers/admin/index.js'

const router = Router()
router.use(authMiddleware, allowRoles('admin'))

router.get('/overview', getAdminOverview)
router.get('/institutions', getMyInstitutions)
router.get('/institutions/:id/stats', getInstitutionStats)
router.get('/institutions/:id/detail', getAdminInstitutionDetail)
router.get('/pending/:institutionId', getPendingUsers)
router.get('/all-pending', getAllPendingUsers)
router.patch('/approve-user', approveUser)
router.patch('/reject-user', rejectUser)
router.get('/reports/:institutionId', getAdminReports)
router.get('/users', getAdminUsers)
router.get('/users/:id', getAdminUserById)
router.get('/analytics', getAdminAnalytics)

export default router
