import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getInstitutions, createInstitution, updateInstitution, deleteInstitution,
  getInstitutionDetail,
  getAdmins, createAdmin, deleteAdmin, assignInstitution,
  getPlatformStats,
  getAllUsers, getUserById, updateUserRole, toggleUserApproval, deleteUser,
  getPendingUsers, bulkApproveUsers,
  getEnhancedAnalytics, getPlatformActivity,
  getPlatformSettings, updatePlatformSettings,
} from '../controllers/superadmin/index.js'

const router = Router()
router.use(authMiddleware, allowRoles('superadmin'))

// Stats & Activity
router.get('/stats', getPlatformStats)
router.get('/activity', getPlatformActivity)

// Institutions
router.get('/institutions', getInstitutions)
router.post('/institutions', createInstitution)
router.patch('/institutions/:id', updateInstitution)
router.delete('/institutions/:id', deleteInstitution)
router.get('/institutions/:id/detail', getInstitutionDetail)

// Admins
router.get('/admins', getAdmins)
router.post('/admins', createAdmin)
router.delete('/admins/:id', deleteAdmin)
router.patch('/assign', assignInstitution)

// Users
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/role', updateUserRole)
router.patch('/users/:id/approval', toggleUserApproval)
router.delete('/users/:id', deleteUser)

// Pending Approvals
router.get('/pending-users', getPendingUsers)
router.post('/bulk-approve', bulkApproveUsers)

// Analytics
router.get('/analytics/enhanced', getEnhancedAnalytics)

// Settings
router.get('/settings', getPlatformSettings)
router.patch('/settings', updatePlatformSettings)

export default router
