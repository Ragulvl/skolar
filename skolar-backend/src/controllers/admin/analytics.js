import prisma from '../../config/prisma.js'
import { getAssignedInstitutionIds } from './overview.js'

// ─── GET /admin/analytics ──────────────────────────────────────────────────────
export async function getAdminAnalytics(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)
    if (institutionIds.length === 0) {
      return res.json({ success: true, data: {
        roleDistribution: [], institutionUsers: [],
        attendanceOverall: { present: 0, absent: 0, late: 0, total: 0, percentage: '0' },
        assessmentOverall: { avgScore: 0, totalResults: 0 },
      }})
    }

    const [roleCounts, institutionUsers, attendanceStats, assessmentStats] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], where: { institutionId: { in: institutionIds } }, _count: true }),
      prisma.institution.findMany({
        where: { id: { in: institutionIds } },
        select: { id: true, name: true, type: true, _count: { select: { users: true } } },
        orderBy: { users: { _count: 'desc' } },
      }),
      prisma.attendance.groupBy({
        by: ['status'], where: { student: { institutionId: { in: institutionIds } } }, _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { institutionId: { in: institutionIds } } },
        _avg: { score: true }, _count: true,
      }),
    ])

    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        roleDistribution: roleCounts.map(r => ({ role: r.role, count: r._count })),
        institutionUsers: institutionUsers.map(i => ({ name: i.name, type: i.type, users: i._count.users })),
        attendanceOverall: {
          present: attMap.present || 0, absent: attMap.absent || 0, late: attMap.late || 0,
          total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessmentOverall: {
          avgScore: assessmentStats._avg.score ? Math.round(assessmentStats._avg.score) : 0,
          totalResults: assessmentStats._count,
        },
      },
    })
  } catch (error) {
    console.error('getAdminAnalytics error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' })
  }
}

// ─── GET /admin/institutions/:id/detail ────────────────────────────────────────
export async function getAdminInstitutionDetail(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)
    const { id } = req.params

    if (!institutionIds.includes(id)) {
      return res.status(403).json({ success: false, error: 'Access denied: institution not assigned to you' })
    }

    const [institution, roleCounts, grades, subjects, departments, recentUsers] = await Promise.all([
      prisma.institution.findUnique({
        where: { id },
        include: { _count: { select: { users: true, sections: true, subjects: true, departments: true } } },
      }),
      prisma.user.groupBy({ by: ['role'], where: { institutionId: id }, _count: true }),
      prisma.grade.findMany({
        include: {
          sections: { where: { institutionId: id }, include: { _count: { select: { users: true } } } },
        },
        orderBy: { name: 'asc' }, take: 50,
      }),
      prisma.subject.findMany({
        where: { institutionId: id },
        include: { grade: { select: { name: true } }, department: { select: { name: true } } },
        orderBy: { name: 'asc' }, take: 100,
      }),
      prisma.department.findMany({
        where: { institutionId: id },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.user.findMany({
        where: { institutionId: id },
        select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 10,
      }),
    ])

    if (!institution) return res.status(404).json({ success: false, error: 'Institution not found' })

    res.json({
      success: true,
      data: {
        ...institution,
        roleCounts: roleCounts.reduce((acc, r) => { acc[r.role] = r._count; return acc }, {}),
        grades: grades.filter(g => g.sections.length > 0),
        subjects, departments, recentUsers,
      },
    })
  } catch (error) {
    console.error('Admin institution detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch institution details' })
  }
}
