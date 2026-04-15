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
      take: 100,
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

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
      take: 100,
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

// ─── Helper: Get assigned institution IDs for admin ────────────────────────────
async function getAssignedInstitutionIds(adminId) {
  const assignments = await prisma.adminInstitutionAssignment.findMany({
    where: { adminId, isActive: true },
    select: { institutionId: true },
  })
  return assignments.map(a => a.institutionId)
}

// ─── GET /admin/users — Browse users across assigned institutions ──────────────
export async function getAdminUsers(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)
    if (institutionIds.length === 0) {
      return res.json({ success: true, data: [], pagination: { total: 0, hasMore: false, nextCursor: null } })
    }

    const { role, institutionId, search, cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { institutionId: { in: institutionIds } }
    if (role && role !== 'all') where.role = role
    if (institutionId && institutionIds.includes(institutionId)) {
      where.institutionId = institutionId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        role: true, isApproved: true, createdAt: true,
        institution: { select: { id: true, name: true, type: true, code: true } },
      },
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true,
      data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('getAdminUsers error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

// ─── GET /admin/users/:id — User detail (read-only) ───────────────────────────
export async function getAdminUserById(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)
    const { id } = req.params

    const [user, attendanceStats, avgScoreResult] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: {
          institution: { select: { id: true, name: true, type: true, code: true, city: true } },
          grade: { select: { id: true, name: true, category: true } },
          section: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          teacherAssignments: {
            include: {
              subject: { select: { name: true } },
              section: { select: { name: true, grade: { select: { name: true } } } },
            },
          },
          teacherDeptAssignments: {
            include: { department: { select: { name: true } } },
          },
          assessmentResults: {
            select: { score: true, assessment: { select: { title: true } } },
            orderBy: { submittedAt: 'desc' },
            take: 20,
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId: id },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { studentId: id },
        _avg: { score: true },
        _count: true,
      }),
    ])

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Verify user belongs to one of admin's assigned institutions
    if (!institutionIds.includes(user.institutionId)) {
      return res.status(403).json({ success: false, error: 'Access denied: user not in your institutions' })
    }

    const attendanceMap = {}
    attendanceStats.forEach(a => { attendanceMap[a.status] = a._count })
    const totalAttendance = Object.values(attendanceMap).reduce((a, b) => a + b, 0)
    const presentCount = attendanceMap.present || 0
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null
    const avgScore = avgScoreResult._count > 0 ? Math.round(avgScoreResult._avg.score) : null

    res.json({
      success: true,
      data: {
        ...user,
        attendanceSummary: { total: totalAttendance, present: presentCount, rate: attendanceRate },
        averageScore: avgScore,
      },
    })
  } catch (error) {
    console.error('getAdminUserById error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
}

// ─── GET /admin/analytics — Cross-institution analytics ────────────────────────
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
      prisma.user.groupBy({
        by: ['role'],
        where: { institutionId: { in: institutionIds } },
        _count: true,
      }),
      prisma.institution.findMany({
        where: { id: { in: institutionIds } },
        select: { id: true, name: true, type: true, _count: { select: { users: true } } },
        orderBy: { users: { _count: 'desc' } },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { institutionId: { in: institutionIds } } },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { institutionId: { in: institutionIds } } },
        _avg: { score: true },
        _count: true,
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

// ─── GET /admin/institutions/:id/detail — Institution deep-dive (read-only) ───
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
        include: {
          _count: { select: { users: true, sections: true, subjects: true, departments: true } },
        },
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { institutionId: id },
        _count: true,
      }),
      prisma.grade.findMany({
        include: {
          sections: {
            where: { institutionId: id },
            include: { _count: { select: { users: true } } },
          },
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
      prisma.subject.findMany({
        where: { institutionId: id },
        include: {
          grade: { select: { name: true } },
          department: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      prisma.department.findMany({
        where: { institutionId: id },
        include: {
          _count: { select: { users: true, subjects: true } },
        },
      }),
      prisma.user.findMany({
        where: { institutionId: id },
        select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    if (!institution) {
      return res.status(404).json({ success: false, error: 'Institution not found' })
    }

    const activeGrades = grades.filter(g => g.sections.length > 0)

    res.json({
      success: true,
      data: {
        ...institution,
        roleCounts: roleCounts.reduce((acc, r) => { acc[r.role] = r._count; return acc }, {}),
        grades: activeGrades,
        subjects,
        departments,
        recentUsers,
      },
    })
  } catch (error) {
    console.error('Admin institution detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch institution details' })
  }
}

