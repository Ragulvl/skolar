import prisma from '../../config/prisma.js'

// ─── Helper: Get assigned institution IDs for admin ────────────────────────────
export async function getAssignedInstitutionIds(adminId) {
  const assignments = await prisma.adminInstitutionAssignment.findMany({
    where: { adminId, isActive: true },
    select: { institutionId: true },
  })
  return assignments.map(a => a.institutionId)
}

// ─── GET /admin/overview ───────────────────────────────────────────────────────
export async function getAdminOverview(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)

    if (institutionIds.length === 0) {
      return res.json({ success: true, data: { institutions: 0, students: 0, teachers: 0, pending: 0 } })
    }

    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      where: { institutionId: { in: institutionIds } },
      _count: true,
    })

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    res.json({
      success: true,
      data: {
        institutions: institutionIds.length,
        students: roleMap.student || 0,
        teachers: roleMap.teacher || 0,
        pending: roleMap.pending || 0,
        totalUsers: Object.values(roleMap).reduce((a, b) => a + b, 0),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch overview' })
  }
}

// ─── GET /admin/institutions ───────────────────────────────────────────────────
export async function getMyInstitutions(req, res) {
  try {
    const assignments = await prisma.adminInstitutionAssignment.findMany({
      where: { adminId: req.user.id, isActive: true },
      include: { institution: { include: { _count: { select: { users: true } } } } }
    })

    const institutionIds = assignments.map(a => a.institutionId)
    if (institutionIds.length === 0) return res.json({ success: true, data: [] })

    const roleCounts = await prisma.user.groupBy({
      by: ['institutionId', 'role'],
      where: { institutionId: { in: institutionIds } },
      _count: true,
    })

    const statsMap = {}
    roleCounts.forEach(rc => {
      if (!statsMap[rc.institutionId]) statsMap[rc.institutionId] = {}
      statsMap[rc.institutionId][rc.role] = rc._count
    })

    const institutions = assignments.map(a => ({
      ...a.institution,
      stats: {
        students: statsMap[a.institutionId]?.student || 0,
        teachers: statsMap[a.institutionId]?.teacher || 0,
        pending: statsMap[a.institutionId]?.pending || 0,
      }
    }))

    res.json({ success: true, data: institutions })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch institutions' })
  }
}

// ─── GET /admin/institutions/:id/stats ─────────────────────────────────────────
export async function getInstitutionStats(req, res) {
  try {
    const { id } = req.params

    const [roleCounts, assessments, attendance] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], where: { institutionId: id }, _count: true }),
      prisma.assessment.count({ where: { creator: { institutionId: id } } }),
      prisma.attendance.count({ where: { student: { institutionId: id } } }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    res.json({
      success: true,
      data: {
        students: roleMap.student || 0, teachers: roleMap.teacher || 0,
        pending: roleMap.pending || 0, assessments, attendance,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

// ─── GET /admin/reports/:institutionId ──────────────────────────────────────────
export async function getAdminReports(req, res) {
  try {
    const { institutionId } = req.params

    const [attendanceStats, assessmentAvg, roleCounts] = await Promise.all([
      prisma.attendance.groupBy({ by: ['status'], where: { student: { institutionId } }, _count: true }),
      prisma.assessmentResult.aggregate({ where: { student: { institutionId } }, _avg: { score: true }, _count: true }),
      prisma.user.groupBy({ by: ['role'], where: { institutionId }, _count: true }),
    ])

    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    res.json({
      success: true,
      data: {
        attendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessments: {
          avgScore: assessmentAvg._avg.score ? Math.round(assessmentAvg._avg.score) : 0,
          totalResults: assessmentAvg._count,
        },
        users: {
          students: roleMap.student || 0, teachers: roleMap.teacher || 0,
          total: Object.values(roleMap).reduce((a, b) => a + b, 0),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}
