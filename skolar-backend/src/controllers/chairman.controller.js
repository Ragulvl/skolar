import prisma from '../config/prisma.js'

// GET /chairman/overview
export async function getChairmanOverview(req, res) {
  try {
    const institutionId = req.user.institutionId
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution assigned' })

    const [roleCounts, departments, assessments, attendanceStats] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], where: { institutionId }, _count: true }),
      prisma.department.findMany({
        where: { institutionId },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.assessment.count({ where: { creator: { institutionId } } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { institutionId } },
        _count: true,
      }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)
    const attPct = attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0'

    res.json({
      success: true,
      data: {
        departments: departments.length,
        teachers: roleMap.teacher || 0,
        students: roleMap.student || 0,
        staff: (roleMap.principal || 0) + (roleMap.vice_principal || 0) + (roleMap.dean || 0) + (roleMap.hod || 0) + (roleMap.teacher || 0),
        pending: roleMap.pending || 0,
        assessments,
        attendancePercentage: attPct,
        departmentList: departments.map(d => ({
          id: d.id, name: d.name, hodId: d.hodId, deanId: d.deanId,
          teachers: d._count.users, subjects: d._count.subjects, students: 0,
        })),
      },
    })
  } catch (error) {
    console.error('Chairman overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch overview' })
  }
}

// GET /chairman/departments
export async function getChairmanDepartments(req, res) {
  try {
    const institutionId = req.user.institutionId
    const departments = await prisma.department.findMany({
      where: { institutionId },
      include: {
        _count: { select: { users: true, subjects: true } },
      },
    })

    // Get HOD and Dean names
    const hodIds = departments.map(d => d.hodId).filter(Boolean)
    const deanIds = departments.map(d => d.deanId).filter(Boolean)
    const allIds = [...new Set([...hodIds, ...deanIds])]

    const users = allIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: allIds } },
      select: { id: true, name: true },
    }) : []
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u.name })

    const result = departments.map(d => ({
      id: d.id, name: d.name,
      hodId: d.hodId, hodName: d.hodId ? userMap[d.hodId] || '—' : '—',
      deanId: d.deanId, deanName: d.deanId ? userMap[d.deanId] || '—' : '—',
      teachers: d._count.users, subjects: d._count.subjects,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

// GET /chairman/staff
export async function getChairmanStaff(req, res) {
  try {
    const institutionId = req.user.institutionId
    const staff = await prisma.user.findMany({
      where: {
        institutionId,
        role: { in: ['principal', 'vice_principal', 'dean', 'hod', 'teacher'] },
      },
      select: {
        id: true, name: true, email: true, role: true, avatarUrl: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: staff })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' })
  }
}

// GET /chairman/students
export async function getChairmanStudents(req, res) {
  try {
    const institutionId = req.user.institutionId
    const { departmentId } = req.query

    const where = { institutionId, role: 'student' }
    if (departmentId) where.departmentId = departmentId

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true,
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// GET /chairman/analytics
export async function getChairmanAnalytics(req, res) {
  try {
    const institutionId = req.user.institutionId

    const [departments, roleCounts, attendanceStats, assessmentStats] = await Promise.all([
      prisma.department.findMany({
        where: { institutionId },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.user.groupBy({ by: ['role'], where: { institutionId }, _count: true }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { institutionId } },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { institutionId } },
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
          name: d.name, teachers: d._count.users, subjects: d._count.subjects,
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

// GET /chairman/pending
export async function getChairmanPending(req, res) {
  try {
    const institutionId = req.user.institutionId
    const pending = await prisma.user.findMany({
      where: { institutionId, role: 'pending' },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: pending })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}
