import prisma from '../../config/prisma.js'
import { getPermissionFlags } from '../../middleware/access.middleware.js'

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

    const hodDeanIds = [...new Set([
      ...departments.map(d => d.hodId), ...departments.map(d => d.deanId),
    ].filter(Boolean))]
    const hdUsers = hodDeanIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodDeanIds } }, select: { id: true, name: true }, take: 50,
    }) : []
    const hdMap = {}
    hdUsers.forEach(u => { hdMap[u.id] = u.name })

    res.json({
      success: true,
      data: {
        institution,
        departments: departments.length,
        teachers: roleMap.teacher || 0, students: roleMap.student || 0,
        staff: (roleMap.principal || 0) + (roleMap.vice_principal || 0) + (roleMap.dean || 0) + (roleMap.hod || 0) + (roleMap.teacher || 0),
        pending: roleMap.pending || 0, assessments,
        todayAttendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, late: attMap.late || 0,
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
      prisma.attendance.groupBy({ by: ['status'], where: { student: { institutionId: instId } }, _count: true }),
      prisma.assessmentResult.aggregate({
        where: { student: { institutionId: instId } }, _avg: { score: true }, _count: true,
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
      where: { institutionId: instId }, select: { id: true, name: true },
    })
    const deptIds = departments.map(d => d.id)
    const deptNameMap = {}
    departments.forEach(d => { deptNameMap[d.id] = d.name })

    const dailyStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { student: { institutionId: instId }, date: { gte: selectedDate, lt: nextDay } },
      _count: true,
    })
    const dailyMap = {}
    dailyStats.forEach(a => { dailyMap[a.status] = a._count })
    const dailyTotal = Object.values(dailyMap).reduce((a, b) => a + b, 0)

    const deptBreakdownRaw = await prisma.$queryRaw`
      SELECT u."departmentId", a."status", COUNT(*)::int as count
      FROM "Attendance" a
      JOIN "User" u ON a."studentId" = u."id"
      WHERE u."institutionId" = ${instId}
        AND a."date" >= ${selectedDate}
        AND a."date" < ${nextDay}
      GROUP BY u."departmentId", a."status"
    `
    const deptStats = {}
    deptIds.forEach(id => { deptStats[id] = { departmentId: id, name: deptNameMap[id], present: 0, absent: 0, late: 0, total: 0 } })
    deptBreakdownRaw.forEach(r => {
      const did = r.departmentId
      if (deptStats[did]) {
        deptStats[did][r.status] = (deptStats[did][r.status] || 0) + r.count
        deptStats[did].total += r.count
      }
    })
    Object.values(deptStats).forEach(d => {
      d.percentage = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : '0'
    })

    const trendRaw = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { student: { institutionId: instId }, date: { gte: trendStart, lt: nextDay } },
      _count: true,
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
        trendMap[key][r.status] = (trendMap[key][r.status] || 0) + r._count
        trendMap[key].total += r._count
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
