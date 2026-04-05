import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getChairmanOverview, getChairmanDepartments, getChairmanStaff,
  getChairmanStudents, getChairmanAnalytics, getChairmanPending,
} from '../controllers/chairman.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('chairman', 'vice_chairman'))

router.get('/overview', getChairmanOverview)
router.get('/departments', getChairmanDepartments)
router.get('/staff', getChairmanStaff)
router.get('/students', getChairmanStudents)
router.get('/analytics', getChairmanAnalytics)
router.get('/pending', getChairmanPending)

export default router
