import prisma from '../config/prisma.js'

// GET /admin/overview — aggregated stats across all assigned institutions
export async function getAdminOverview(req, res) {
  try {
    const assignments = await prisma.adminInstitutionAssignment.findMany({
      where: { adminId: req.user.id, isActive: true },
      select: { institutionId: true },
    })
    const institutionIds = assignments.map(a => a.institutionId)

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

export async function getMyInstitutions(req, res) {
  try {
    const assignments = await prisma.adminInstitutionAssignment.findMany({
      where: { adminId: req.user.id, isActive: true },
      include: {
        institution: {
          include: { _count: { select: { users: true } } }
        }
      }
    })

    const institutionIds = assignments.map(a => a.institutionId)

    if (institutionIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

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

export async function getInstitutionStats(req, res) {
  try {
    const { id } = req.params

    const [roleCounts, assessments, attendance] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        where: { institutionId: id },
        _count: true,
      }),
      prisma.assessment.count({ where: { creator: { institutionId: id } } }),
      prisma.attendance.count({ where: { student: { institutionId: id } } }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    res.json({
      success: true,
      data: {
        students: roleMap.student || 0,
        teachers: roleMap.teacher || 0,
        pending: roleMap.pending || 0,
        assessments,
        attendance,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

export async function getPendingUsers(req, res) {
  try {
    const { institutionId } = req.params
    const users = await prisma.user.findMany({
      where: { institutionId, role: 'pending' },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

// GET /admin/all-pending — pending users across ALL assigned institutions
export async function getAllPendingUsers(req, res) {
  try {
    const assignments = await prisma.adminInstitutionAssignment.findMany({
      where: { adminId: req.user.id, isActive: true },
      select: { institutionId: true },
    })
    const institutionIds = assignments.map(a => a.institutionId)

    const users = await prisma.user.findMany({
      where: { institutionId: { in: institutionIds }, role: 'pending' },
      select: {
        id: true, name: true, email: true, avatarUrl: true, createdAt: true,
        institution: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

export async function approveUser(req, res) {
  try {
    const { userId, role } = req.body
    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'userId and role are required' })
    }

    const validRoles = ['principal', 'vice_principal', 'chairman', 'vice_chairman', 'dean', 'hod', 'teacher', 'student']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role, isApproved: true },
    })

    res.json({ success: true, data: { id: user.id, name: user.name, role: user.role, isApproved: user.isApproved } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve user' })
  }
}

// PATCH /admin/reject-user
export async function rejectUser(req, res) {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' })

    await prisma.user.delete({ where: { id: userId } })
    res.json({ success: true, data: { message: 'User rejected and removed' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject user' })
  }
}

// GET /admin/reports/:institutionId
export async function getAdminReports(req, res) {
  try {
    const { institutionId } = req.params

    const [attendanceStats, assessmentAvg, roleCounts] = await Promise.all([
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
      prisma.user.groupBy({
        by: ['role'],
        where: { institutionId },
        _count: true,
      }),
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
          students: roleMap.student || 0,
          teachers: roleMap.teacher || 0,
          total: Object.values(roleMap).reduce((a, b) => a + b, 0),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}

