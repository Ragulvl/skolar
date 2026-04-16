import prisma from '../../config/prisma.js'
import { getAssignedInstitutionIds } from './overview.js'

// ─── GET /admin/users ──────────────────────────────────────────────────────────
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
    if (institutionId && institutionIds.includes(institutionId)) where.institutionId = institutionId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where, orderBy: { createdAt: 'desc' }, take: limit + 1,
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
      success: true, data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('getAdminUsers error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

// ─── GET /admin/users/:id ──────────────────────────────────────────────────────
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
          teacherDeptAssignments: { include: { department: { select: { name: true } } } },
          assessmentResults: {
            select: { score: true, assessment: { select: { title: true } } },
            orderBy: { submittedAt: 'desc' }, take: 20,
          },
        },
      }),
      prisma.attendance.groupBy({ by: ['status'], where: { studentId: id }, _count: true }),
      prisma.assessmentResult.aggregate({ where: { studentId: id }, _avg: { score: true }, _count: true }),
    ])

    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
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

// ─── Pending Users ─────────────────────────────────────────────────────────────
export async function getPendingUsers(req, res) {
  try {
    const { institutionId } = req.params
    const users = await prisma.user.findMany({
      where: { institutionId, role: 'pending' },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

export async function getAllPendingUsers(req, res) {
  try {
    const institutionIds = await getAssignedInstitutionIds(req.user.id)
    const users = await prisma.user.findMany({
      where: { institutionId: { in: institutionIds }, role: 'pending' },
      select: {
        id: true, name: true, email: true, avatarUrl: true, createdAt: true,
        institution: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

export async function approveUser(req, res) {
  try {
    const { userId, role } = req.body
    if (!userId || !role) return res.status(400).json({ success: false, error: 'userId and role are required' })

    const validRoles = ['principal', 'vice_principal', 'chairman', 'vice_chairman', 'dean', 'hod', 'teacher', 'student']
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' })

    const user = await prisma.user.update({
      where: { id: userId }, data: { role, isApproved: true },
    })
    res.json({ success: true, data: { id: user.id, name: user.name, role: user.role, isApproved: user.isApproved } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve user' })
  }
}

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
