import prisma from '../config/prisma.js'
import { getPermissionFlags } from '../middleware/access.middleware.js'

// ═══════════════════════════════════════════════
// PERMISSION HELPERS
// ═══════════════════════════════════════════════

function requireFlag(flag, action) {
  return (req, res, next) => {
    const flags = getPermissionFlags(req.user.role)
    if (!flags[flag]) {
      return res.status(403).json({ success: false, error: `Permission denied: cannot ${action}` })
    }
    next()
  }
}

export const requireManageDepts = requireFlag('canManageDepts', 'manage departments')
export const requireAssignDean = requireFlag('canAssignDean', 'assign deans')
export const requireApproveUsers = requireFlag('canApproveUsers', 'approve users')
export const requireAssignHOD = requireFlag('canAssignHOD', 'assign HODs')

// ═══════════════════════════════════════════════
// GET /college-admin/overview
// ═══════════════════════════════════════════════

export async function getOverview(req, res) {
  try {
    const instId = req.user.institutionId
    if (!instId) return res.status(400).json({ success: false, error: 'No institution assigned' })

    const flags = getPermissionFlags(req.user.role)

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const [roleCounts, departments, assessments, todayAttendance, institution] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], where: { institutionId: instId }, _count: true }),
      prisma.department.findMany({
        where: { institutionId: instId },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.assessment.count({ where: { creator: { institutionId: instId } } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { institutionId: instId }, date: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      prisma.institution.findUnique({ where: { id: instId }, select: { name: true, type: true, code: true } }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    const attMap = {}
    todayAttendance.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    // HOD and Dean names for departments
    const hodDeanIds = [...new Set([
      ...departments.map(d => d.hodId),
      ...departments.map(d => d.deanId),
    ].filter(Boolean))]
    const hdUsers = hodDeanIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodDeanIds } },
      select: { id: true, name: true },
    }) : []
    const hdMap = {}
    hdUsers.forEach(u => { hdMap[u.id] = u.name })

    res.json({
      success: true,
      data: {
        institution,
        departments: departments.length,
        teachers: roleMap.teacher || 0,
        students: roleMap.student || 0,
        staff: (roleMap.principal || 0) + (roleMap.vice_principal || 0) + (roleMap.dean || 0) + (roleMap.hod || 0) + (roleMap.teacher || 0),
        pending: roleMap.pending || 0,
        assessments,
        todayAttendance: {
          present: attMap.present || 0,
          absent: attMap.absent || 0,
          late: attMap.late || 0,
          total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        departmentList: departments.map(d => ({
          id: d.id, name: d.name,
          hodId: d.hodId, hodName: d.hodId ? hdMap[d.hodId] || '—' : '—',
          deanId: d.deanId, deanName: d.deanId ? hdMap[d.deanId] || '—' : '—',
          teacherCount: d._count.users, subjectCount: d._count.subjects,
        })),
        permissions: flags,
      },
    })
  } catch (error) {
    console.error('College admin overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch overview' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments
// ═══════════════════════════════════════════════

export async function getDepartments(req, res) {
  try {
    const instId = req.user.institutionId
    const departments = await prisma.department.findMany({
      where: { institutionId: instId },
      include: { _count: { select: { users: true, subjects: true } } },
    })

    const hodDeanIds = [...new Set([
      ...departments.map(d => d.hodId),
      ...departments.map(d => d.deanId),
    ].filter(Boolean))]
    const users = hodDeanIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodDeanIds } },
      select: { id: true, name: true, email: true },
    }) : []
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u })

    const result = departments.map(d => ({
      id: d.id, name: d.name,
      hodId: d.hodId, hod: d.hodId ? userMap[d.hodId] || null : null,
      deanId: d.deanId, dean: d.deanId ? userMap[d.deanId] || null : null,
      teacherCount: d._count.users, subjectCount: d._count.subjects,
    }))

    res.json({ success: true, data: result, permissions: getPermissionFlags(req.user.role) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId — Drill-down
// ═══════════════════════════════════════════════

export async function getDepartmentDetail(req, res) {
  try {
    const instId = req.user.institutionId
    const { deptId } = req.params

    const dept = await prisma.department.findUnique({
      where: { id: deptId },
      include: { _count: { select: { users: true, subjects: true } } },
    })
    if (!dept || dept.institutionId !== instId) {
      return res.status(404).json({ success: false, error: 'Department not found' })
    }

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const [teachers, students, subjects, todayAtt, hod, dean] = await Promise.all([
      prisma.user.findMany({
        where: { departmentId: deptId, role: 'teacher' },
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          teacherAssignments: {
            where: { isActive: true },
            include: { subject: { select: { name: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { departmentId: deptId, role: 'student' },
        select: { id: true, name: true, email: true, avatarUrl: true },
        orderBy: { name: 'asc' },
      }),
      prisma.subject.findMany({
        where: { departmentId: deptId },
        include: {
          teacherAssignments: {
            where: { isActive: true },
            include: { teacher: { select: { id: true, name: true } } },
          },
          _count: { select: { assessments: true, attendances: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { departmentId: deptId }, date: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      dept.hodId ? prisma.user.findUnique({
        where: { id: dept.hodId },
        select: { id: true, name: true, email: true, avatarUrl: true },
      }) : null,
      dept.deanId ? prisma.user.findUnique({
        where: { id: dept.deanId },
        select: { id: true, name: true, email: true, avatarUrl: true },
      }) : null,
    ])

    const attMap = {}
    todayAtt.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        id: dept.id, name: dept.name,
        hod, dean,
        stats: {
          teachers: teachers.length,
          students: students.length,
          subjects: subjects.length,
          todayAttendance: {
            present: attMap.present || 0, absent: attMap.absent || 0,
            total: attTotal,
            percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
          },
        },
        teachers, students, subjects,
      },
      permissions: getPermissionFlags(req.user.role),
    })
  } catch (error) {
    console.error('Department detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch department details' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId/teachers/:teacherId — Teacher Profile
// ═══════════════════════════════════════════════

export async function getTeacherProfile(req, res) {
  try {
    const instId = req.user.institutionId
    const { teacherId } = req.params

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true,
        department: { select: { id: true, name: true } },
        teacherAssignments: {
          where: { isActive: true },
          include: { subject: { select: { id: true, name: true, department: { select: { name: true } } } } },
        },
      },
    })
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, error: 'Teacher not found' })
    }

    // Attendance submission history
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['date'],
      where: { teacherId },
      _count: true,
      orderBy: { date: 'desc' },
      take: 30,
    })

    // Assessments created
    const assessments = await prisma.assessment.findMany({
      where: { createdBy: teacherId },
      include: {
        subject: { select: { name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Student performance in teacher's subjects
    const subjectIds = teacher.teacherAssignments.map(a => a.subject.id)
    const subjectPerformance = subjectIds.length > 0 ? await prisma.assessmentResult.groupBy({
      by: ['assessmentId'],
      where: { assessment: { subjectId: { in: subjectIds } } },
      _avg: { score: true },
      _count: true,
    }) : []

    res.json({
      success: true,
      data: {
        ...teacher,
        attendanceDays: attendanceStats.length,
        lastMarked: attendanceStats[0]?.date || null,
        attendanceHistory: attendanceStats.map(a => ({ date: a.date, records: a._count })),
        assessments,
        assessmentsCreated: assessments.length,
        subjectAvgScores: subjectPerformance,
      },
    })
  } catch (error) {
    console.error('Teacher profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch teacher profile' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId/students/:studentId — Student Profile
// ═══════════════════════════════════════════════

export async function getStudentProfile(req, res) {
  try {
    const { studentId } = req.params

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true,
        department: { select: { id: true, name: true } },
      },
    })
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    // Attendance per subject
    const attendanceRaw = await prisma.attendance.findMany({
      where: { studentId },
      include: { subject: { select: { id: true, name: true } } },
    })
    const subjectAttMap = {}
    attendanceRaw.forEach(a => {
      if (!subjectAttMap[a.subjectId]) {
        subjectAttMap[a.subjectId] = { subjectId: a.subjectId, name: a.subject.name, present: 0, absent: 0, late: 0, total: 0 }
      }
      subjectAttMap[a.subjectId][a.status] = (subjectAttMap[a.subjectId][a.status] || 0) + 1
      subjectAttMap[a.subjectId].total++
    })
    const attendanceBySubject = Object.values(subjectAttMap).map(s => ({
      ...s, percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0',
    }))

    // Assessment scores
    const assessmentResults = await prisma.assessmentResult.findMany({
      where: { studentId },
      include: {
        assessment: {
          select: { title: true, type: true, subject: { select: { name: true } }, dueDate: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Certificates
    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        issuer: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })

    // Overall stats
    const totalAtt = attendanceRaw.length
    const totalPresent = attendanceRaw.filter(a => a.status === 'present').length
    const avgScore = assessmentResults.length > 0
      ? (assessmentResults.reduce((sum, r) => sum + r.score, 0) / assessmentResults.length).toFixed(1)
      : '0'

    res.json({
      success: true,
      data: {
        ...student,
        overallStats: {
          attendancePercentage: totalAtt > 0 ? ((totalPresent / totalAtt) * 100).toFixed(1) : '0',
          totalAssessments: assessmentResults.length,
          avgScore,
          certificateCount: certificates.length,
        },
        attendanceBySubject,
        assessmentResults,
        certificates,
      },
    })
  } catch (error) {
    console.error('Student profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch student profile' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/staff
// ═══════════════════════════════════════════════

export async function getStaff(req, res) {
  try {
    const instId = req.user.institutionId
    const { departmentId, role: filterRole } = req.query

    const where = {
      institutionId: instId,
      role: { in: ['principal', 'vice_principal', 'dean', 'hod', 'teacher'] },
    }
    if (departmentId) where.departmentId = departmentId
    if (filterRole) where.role = filterRole

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, avatarUrl: true,
        department: { select: { id: true, name: true } },
        teacherAssignments: {
          where: { isActive: true },
          include: { subject: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: staff })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/students
// ═══════════════════════════════════════════════

export async function getStudents(req, res) {
  try {
    const instId = req.user.institutionId
    const { departmentId } = req.query

    const where = { institutionId: instId, role: 'student' }
    if (departmentId) where.departmentId = departmentId

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/attendance?date=
// ═══════════════════════════════════════════════

export async function getAttendance(req, res) {
  try {
    const instId = req.user.institutionId
    const dateStr = req.query.date
    const selectedDate = dateStr ? new Date(dateStr) : new Date()
    selectedDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const trendStart = new Date(selectedDate)
    trendStart.setDate(trendStart.getDate() - 6)

    const departments = await prisma.department.findMany({
      where: { institutionId: instId },
      select: { id: true, name: true },
    })
    const deptIds = departments.map(d => d.id)
    const deptNameMap = {}
    departments.forEach(d => { deptNameMap[d.id] = d.name })

    // Daily stats
    const dailyStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { student: { institutionId: instId }, date: { gte: selectedDate, lt: nextDay } },
      _count: true,
    })
    const dailyMap = {}
    dailyStats.forEach(a => { dailyMap[a.status] = a._count })
    const dailyTotal = Object.values(dailyMap).reduce((a, b) => a + b, 0)

    // Per-dept breakdown
    const deptBreakdownRaw = await prisma.attendance.findMany({
      where: {
        student: { institutionId: instId },
        date: { gte: selectedDate, lt: nextDay },
      },
      select: { status: true, student: { select: { departmentId: true } } },
    })
    const deptStats = {}
    deptIds.forEach(id => { deptStats[id] = { departmentId: id, name: deptNameMap[id], present: 0, absent: 0, late: 0, total: 0 } })
    deptBreakdownRaw.forEach(r => {
      const did = r.student.departmentId
      if (deptStats[did]) {
        deptStats[did][r.status] = (deptStats[did][r.status] || 0) + 1
        deptStats[did].total++
      }
    })
    Object.values(deptStats).forEach(d => {
      d.percentage = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : '0'
    })

    // 7-day trend
    const trendRaw = await prisma.attendance.findMany({
      where: { student: { institutionId: instId }, date: { gte: trendStart, lt: nextDay } },
      select: { date: true, status: true },
    })
    const trendMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trendMap[key] = { date: key, present: 0, absent: 0, late: 0, total: 0 }
    }
    trendRaw.forEach(r => {
      const key = r.date.toISOString().split('T')[0]
      if (trendMap[key]) {
        trendMap[key][r.status] = (trendMap[key][r.status] || 0) + 1
        trendMap[key].total++
      }
    })

    res.json({
      success: true,
      data: {
        date: selectedDate.toISOString().split('T')[0],
        daily: {
          present: dailyMap.present || 0, absent: dailyMap.absent || 0, late: dailyMap.late || 0,
          total: dailyTotal,
          percentage: dailyTotal > 0 ? ((dailyMap.present || 0) / dailyTotal * 100).toFixed(1) : '0',
        },
        departments: Object.values(deptStats),
        trend: Object.values(trendMap),
      },
    })
  } catch (error) {
    console.error('College admin attendance error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/analytics
// ═══════════════════════════════════════════════

export async function getAnalytics(req, res) {
  try {
    const instId = req.user.institutionId
    const [departments, roleCounts, attendanceStats, assessmentStats] = await Promise.all([
      prisma.department.findMany({
        where: { institutionId: instId },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.user.groupBy({ by: ['role'], where: { institutionId: instId }, _count: true }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { institutionId: instId } },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { institutionId: instId } },
        _avg: { score: true },
        _count: true,
      }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })
    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        departmentPerformance: departments.map(d => ({
          id: d.id, name: d.name, teachers: d._count.users, subjects: d._count.subjects,
        })),
        roleDistribution: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
        attendanceOverall: {
          present: attMap.present || 0, absent: attMap.absent || 0, total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessmentOverall: {
          avgScore: assessmentStats._avg.score ? Math.round(assessmentStats._avg.score) : 0,
          totalResults: assessmentStats._count,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/pending
// ═══════════════════════════════════════════════

export async function getPending(req, res) {
  try {
    const pending = await prisma.user.findMany({
      where: { institutionId: req.user.institutionId, role: 'pending' },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: pending })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

// ═══════════════════════════════════════════════
// POST /college-admin/departments — Create (Chairman ONLY)
// ═══════════════════════════════════════════════

export async function createDepartment(req, res) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Department name required' })
    const dept = await prisma.department.create({
      data: { name, institutionId: req.user.institutionId },
    })
    res.status(201).json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create department' })
  }
}

// ═══════════════════════════════════════════════
// DELETE /college-admin/departments/:deptId — Remove (Chairman ONLY)
// ═══════════════════════════════════════════════

export async function deleteDepartment(req, res) {
  try {
    const { deptId } = req.params
    const dept = await prisma.department.findUnique({ where: { id: deptId } })
    if (!dept || dept.institutionId !== req.user.institutionId) {
      return res.status(404).json({ success: false, error: 'Department not found' })
    }
    await prisma.department.delete({ where: { id: deptId } })
    res.json({ success: true, data: { message: 'Department deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete department' })
  }
}

// ═══════════════════════════════════════════════
// POST /college-admin/assign-dean (Chairman ONLY)
// ═══════════════════════════════════════════════

export async function assignDean(req, res) {
  try {
    const { departmentId, deanId } = req.body
    if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId required' })
    const dept = await prisma.department.update({
      where: { id: departmentId },
      data: { deanId: deanId || null },
    })
    res.json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign dean' })
  }
}

// ═══════════════════════════════════════════════
// POST /college-admin/assign-hod (L1+L2)
// ═══════════════════════════════════════════════

export async function assignHOD(req, res) {
  try {
    const { departmentId, hodId } = req.body
    if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId required' })
    const dept = await prisma.department.update({
      where: { id: departmentId },
      data: { hodId: hodId || null },
    })
    res.json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign HOD' })
  }
}

// ═══════════════════════════════════════════════
// POST /college-admin/approve-user (L1+L2)
// ═══════════════════════════════════════════════

export async function approveUser(req, res) {
  try {
    const { userId, role } = req.body
    if (!userId || !role) return res.status(400).json({ success: false, error: 'userId and role required' })

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role, isApproved: true },
    })
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve user' })
  }
}

// ═══════════════════════════════════════════════
// POST /college-admin/reject-user (L1+L2)
// ═══════════════════════════════════════════════

export async function rejectUser(req, res) {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' })
    await prisma.user.delete({ where: { id: userId } })
    res.json({ success: true, data: { message: 'User rejected and removed' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject user' })
  }
}
