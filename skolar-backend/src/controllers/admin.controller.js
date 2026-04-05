import prisma from '../config/prisma.js'

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

    // Single groupBy query for ALL institutions at once — replaces the N+1 loop
    // that was doing 3 separate count() calls PER institution
    const roleCounts = await prisma.user.groupBy({
      by: ['institutionId', 'role'],
      where: { institutionId: { in: institutionIds } },
      _count: true,
    })

    // Build a lookup map: { institutionId: { student: N, teacher: N, pending: N } }
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

    // Single groupBy for role counts + parallel queries for assessments/attendance
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
      select: { id: true, name: true, email: true, createdAt: true },
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
