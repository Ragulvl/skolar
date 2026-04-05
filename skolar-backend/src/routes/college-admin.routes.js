import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import {
  getOverview, getDepartments, getDepartmentDetail,
  getTeacherProfile, getStudentProfile,
  getStaff, getStudents, getAttendance, getAnalytics, getPending,
  createDepartment, deleteDepartment,
  assignDean, assignHOD, approveUser, rejectUser,
  requireManageDepts, requireAssignDean, requireApproveUsers,
} from '../controllers/college-admin.controller.js'

const router = Router()

// All 4 L1+L2 roles can access
router.use(authMiddleware, allowRoles('chairman', 'vice_chairman', 'principal', 'vice_principal'))

// ── READ endpoints (all 4 roles) ──
router.get('/overview', getOverview)
router.get('/departments', getDepartments)
router.get('/departments/:deptId', getDepartmentDetail)
router.get('/departments/:deptId/teachers/:teacherId', getTeacherProfile)
router.get('/departments/:deptId/students/:studentId', getStudentProfile)
router.get('/staff', getStaff)
router.get('/students', getStudents)
router.get('/attendance', getAttendance)
router.get('/analytics', getAnalytics)
router.get('/pending', getPending)

// ── WRITE endpoints (permission-gated) ──
router.post('/departments', requireManageDepts, createDepartment)
router.delete('/departments/:deptId', requireManageDepts, deleteDepartment)
router.post('/assign-dean', requireAssignDean, assignDean)
router.post('/assign-hod', assignHOD)
router.post('/approve-user', requireApproveUsers, approveUser)
router.post('/reject-user', requireApproveUsers, rejectUser)

export default router
