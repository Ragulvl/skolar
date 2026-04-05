import prisma from '../config/prisma.js'

// GET /viceprincipal/overview
export async function getVPOverview(req, res) {
  try {
    const userId = req.user.id
    const institutionType = req.user.institution?.type

    if (institutionType === 'school') {
      // Get assigned grades via VicePrincipalAssignment
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: userId, isActive: true, gradeId: { not: null } },
      })
      const gradeIds = assignments.map(a => a.gradeId)

      if (gradeIds.length === 0) {
        return res.json({ success: true, data: { grades: 0, teachers: 0, students: 0, attendance: '0' } })
      }

      const [students, teachers, attendanceStats] = await Promise.all([
        prisma.user.count({ where: { gradeId: { in: gradeIds }, role: 'student', institutionId: req.user.institutionId } }),
        prisma.user.count({ where: { role: 'teacher', institutionId: req.user.institutionId, teacherAssignments: { some: { section: { gradeId: { in: gradeIds } } } } } }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: { student: { gradeId: { in: gradeIds }, institutionId: req.user.institutionId } },
          _count: true,
        }),
      ])

      const attMap = {}
      attendanceStats.forEach(a => { attMap[a.status] = a._count })
      const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

      return res.json({
        success: true,
        data: {
          grades: gradeIds.length, students, teachers,
          attendance: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
          assignedGradeIds: gradeIds,
        },
      })
    } else {
      // College VP — assigned departments
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: userId, isActive: true, departmentId: { not: null } },
      })
      const deptIds = assignments.map(a => a.departmentId)

      if (deptIds.length === 0) {
        return res.json({ success: true, data: { departments: 0, teachers: 0, students: 0, attendance: '0' } })
      }

      const [students, teachers, attendanceStats] = await Promise.all([
        prisma.user.count({ where: { departmentId: { in: deptIds }, role: 'student' } }),
        prisma.user.count({ where: { departmentId: { in: deptIds }, role: 'teacher' } }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: { student: { departmentId: { in: deptIds } } },
          _count: true,
        }),
      ])

      const attMap = {}
      attendanceStats.forEach(a => { attMap[a.status] = a._count })
      const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

      return res.json({
        success: true,
        data: {
          departments: deptIds.length, students, teachers,
          attendance: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
          assignedDeptIds: deptIds,
        },
      })
    }
  } catch (error) {
    console.error('VP overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch VP overview' })
  }
}

// GET /viceprincipal/grades — school VP only
export async function getVPGrades(req, res) {
  try {
    const assignments = await prisma.vicePrincipalAssignment.findMany({
      where: { vpId: req.user.id, isActive: true, gradeId: { not: null } },
    })
    const gradeIds = assignments.map(a => a.gradeId)

    const grades = await prisma.grade.findMany({
      where: { id: { in: gradeIds } },
      include: {
        sections: {
          where: { institutionId: req.user.institutionId },
          include: { _count: { select: { users: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: grades })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch grades' })
  }
}

// GET /viceprincipal/departments — college VP only
export async function getVPDepartments(req, res) {
  try {
    const assignments = await prisma.vicePrincipalAssignment.findMany({
      where: { vpId: req.user.id, isActive: true, departmentId: { not: null } },
    })
    const deptIds = assignments.map(a => a.departmentId)

    const departments = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      include: { _count: { select: { users: true, subjects: true } } },
    })
    res.json({ success: true, data: departments })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

// GET /viceprincipal/teachers
export async function getVPTeachers(req, res) {
  try {
    const instType = req.user.institution?.type
    let where = { role: 'teacher', institutionId: req.user.institutionId }

    if (instType === 'school') {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, gradeId: { not: null } },
      })
      const gradeIds = assignments.map(a => a.gradeId)
      if (gradeIds.length > 0) {
        where.teacherAssignments = { some: { section: { gradeId: { in: gradeIds } } } }
      }
    } else {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, departmentId: { not: null } },
      })
      const deptIds = assignments.map(a => a.departmentId)
      if (deptIds.length > 0) where.departmentId = { in: deptIds }
    }

    const teachers = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: teachers })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' })
  }
}

// GET /viceprincipal/students
export async function getVPStudents(req, res) {
  try {
    const instType = req.user.institution?.type
    let where = { role: 'student', institutionId: req.user.institutionId }

    if (instType === 'school') {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, gradeId: { not: null } },
      })
      const gradeIds = assignments.map(a => a.gradeId)
      if (gradeIds.length > 0) where.gradeId = { in: gradeIds }
    } else {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, departmentId: { not: null } },
      })
      const deptIds = assignments.map(a => a.departmentId)
      if (deptIds.length > 0) where.departmentId = { in: deptIds }
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true,
        grade: { select: { name: true } },
        section: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// GET /viceprincipal/attendance
export async function getVPAttendance(req, res) {
  try {
    const instType = req.user.institution?.type
    let studentWhere = {}

    if (instType === 'school') {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, gradeId: { not: null } },
      })
      const gradeIds = assignments.map(a => a.gradeId)
      studentWhere = { gradeId: { in: gradeIds }, institutionId: req.user.institutionId }
    } else {
      const assignments = await prisma.vicePrincipalAssignment.findMany({
        where: { vpId: req.user.id, isActive: true, departmentId: { not: null } },
      })
      const deptIds = assignments.map(a => a.departmentId)
      studentWhere = { departmentId: { in: deptIds } }
    }

    const stats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { student: studentWhere },
      _count: true,
    })

    const attMap = {}
    stats.forEach(a => { attMap[a.status] = a._count })
    const total = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        present: attMap.present || 0, absent: attMap.absent || 0, total,
        percentage: total > 0 ? ((attMap.present || 0) / total * 100).toFixed(1) : '0',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

// GET /viceprincipal/reports
export async function getVPReports(req, res) {
  try {
    // Delegates to attendance endpoint with same scoping
    return getVPAttendance(req, res)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}
