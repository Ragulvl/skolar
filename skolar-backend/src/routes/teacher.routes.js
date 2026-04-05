import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { allowRoles } from '../middleware/role.middleware.js'
import { isTeacherOfSubject } from '../middleware/access.middleware.js'
import {
  getTeacherDashboard, getTeacherClasses, getTeacherDeptView,
  getTeacherSubjectView, getTeacherStudents,
} from '../controllers/teacher.controller.js'

const router = Router()
router.use(authMiddleware, allowRoles('teacher'))

// Dashboard — returns own-dept + cross-dept subjects separated
router.get('/dashboard', getTeacherDashboard)

// My Classes — list all assignments with isOwnDept flag
router.get('/my-classes', getTeacherClasses)

// Full Dept View — only own dept (controller validates departmentId)
router.get('/dept-view', getTeacherDeptView)

// Subject-scoped view — cross-dept (middleware validates assignment)
router.get('/subject/:subjectId', isTeacherOfSubject(), getTeacherSubjectView)

// My Students — all students across assigned depts
router.get('/my-students', getTeacherStudents)

export default router
