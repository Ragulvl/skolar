import prisma from '../config/prisma.js'

/**
 * 1. isSameInstitution — Chairman, Vice Chairman, Principal, Vice Principal
 */
export function isSameInstitution() {
  return (req, res, next) => {
    const resourceInstitutionId = req.params.institutionId || req.body.institutionId || req.query.institutionId
    if (resourceInstitutionId && resourceInstitutionId !== req.user.institutionId) {
      return res.status(403).json({ success: false, error: 'Access denied: different institution' })
    }
    next()
  }
}

/**
 * 2. isDeanOfDepartment — Dean
 * Validates that the department belongs to this dean.
 */
export function isDeanOfDepartment() {
  return async (req, res, next) => {
    try {
      const deptId = req.params.deptId || req.params.departmentId || req.body.departmentId || req.query.departmentId
      if (!deptId) return next()

      const dept = await prisma.department.findUnique({ where: { id: deptId }, select: { deanId: true } })
      if (!dept || dept.deanId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied: not dean of this department' })
      }
      next()
    } catch (error) {
      res.status(500).json({ success: false, error: 'Access check failed' })
    }
  }
}

/**
 * 3. isHODOfDepartment — HOD
 */
export function isHODOfDepartment() {
  return async (req, res, next) => {
    try {
      const deptId = req.params.deptId || req.params.departmentId || req.body.departmentId || req.query.departmentId
      if (!deptId) return next()

      const dept = await prisma.department.findUnique({ where: { id: deptId }, select: { hodId: true } })
      if (!dept || dept.hodId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied: not HOD of this department' })
      }
      next()
    } catch (error) {
      res.status(500).json({ success: false, error: 'Access check failed' })
    }
  }
}

/**
 * 4. isTeacherOfSubject — Teacher
 */
export function isTeacherOfSubject() {
  return async (req, res, next) => {
    try {
      const subjectId = req.params.subjectId || req.body.subjectId
      if (!subjectId) return next()

      const assignment = await prisma.teacherAssignment.findFirst({
        where: { teacherId: req.user.id, subjectId, isActive: true },
      })
      if (!assignment) {
        return res.status(403).json({ success: false, error: 'Access denied: not assigned to this subject' })
      }
      next()
    } catch (error) {
      res.status(500).json({ success: false, error: 'Access check failed' })
    }
  }
}

/**
 * 5. isTeacherInOwnDept — Teacher (full dept view)
 */
export function isTeacherInOwnDept() {
  return async (req, res, next) => {
    try {
      const deptId = req.params.deptId || req.params.departmentId
      if (!deptId) return next()

      if (deptId !== req.user.departmentId) {
        return res.status(403).json({ success: false, error: 'Access denied: not your department' })
      }
      next()
    } catch (error) {
      res.status(500).json({ success: false, error: 'Access check failed' })
    }
  }
}

/**
 * 6. isOwnStudentData — Student
 */
export function isOwnStudentData() {
  return (req, res, next) => {
    const studentId = req.params.studentId
    if (studentId && studentId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: not your data' })
    }
    next()
  }
}

/**
 * Permission flag helper — derives role capabilities
 */
export function getPermissionFlags(role) {
  const L1_L2 = ['chairman', 'vice_chairman', 'principal', 'vice_principal']
  return {
    canViewAll: L1_L2.includes(role),
    canManageDepts: role === 'chairman',
    canAssignDean: role === 'chairman',
    canApproveUsers: L1_L2.includes(role),
    canAssignHOD: L1_L2.includes(role),
    canManageSubjects: L1_L2.includes(role),
    canAssignTeachers: L1_L2.includes(role),
  }
}
