import prisma from '../../config/prisma.js'
import { invalidateUserCache } from '../../middleware/auth.middleware.js'
import { invalidateCache } from './stats.js'

// ─── User Management ──────────────────────────────────────────────────────────

export async function getAllUsers(req, res) {
  try {
    const { role, institutionId, search, approved, cursor, limit: rawLimit } = req.query
    const where = {}
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    if (role && role !== 'all') where.role = role
    if (institutionId) where.institutionId = institutionId
    if (approved === 'true') where.isApproved = true
    if (approved === 'false') where.isApproved = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where, orderBy: { createdAt: 'desc' }, take: limit + 1,
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true,
        isApproved: true, createdAt: true,
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
    console.error('getAllUsers error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

export async function getUserById(req, res) {
  try {
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
            orderBy: { submittedAt: 'desc' }, take: 20,
          },
        },
      }),
      prisma.attendance.groupBy({ by: ['status'], where: { studentId: id }, _count: true }),
      prisma.assessmentResult.aggregate({ where: { studentId: id }, _avg: { score: true }, _count: true }),
    ])

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
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
    console.error('getUserById error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params
    const { role } = req.body

    const validRoles = ['superadmin', 'admin', 'principal', 'vice_principal', 'chairman', 'vice_chairman', 'dean', 'hod', 'teacher', 'student', 'pending']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Must be: ${validRoles.join(', ')}` })
    }

    const updateData = { role }
    if (role === 'pending') updateData.isApproved = false

    const user = await prisma.user.update({
      where: { id }, data: updateData,
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    })

    invalidateCache('stats')
    invalidateUserCache(id)
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user role' })
  }
}

export async function toggleUserApproval(req, res) {
  try {
    const { id } = req.params
    const { isApproved } = req.body

    const user = await prisma.user.update({
      where: { id }, data: { isApproved },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    })

    invalidateUserCache(id)
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update approval status' })
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params

    if (req.user.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' })
    }

    await prisma.attendance.deleteMany({ where: { OR: [{ studentId: id }, { teacherId: id }] } })
    await prisma.assessmentResult.deleteMany({ where: { studentId: id } })

    const assessments = await prisma.assessment.findMany({ where: { createdBy: id }, select: { id: true }, take: 1000 })
    const assessmentIds = assessments.map(a => a.id)
    if (assessmentIds.length > 0) {
      await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
      await prisma.assessmentResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
      await prisma.assessment.deleteMany({ where: { id: { in: assessmentIds } } })
    }

    await prisma.teacherAssignment.deleteMany({ where: { teacherId: id } })
    await prisma.teacherDeptAssignment.deleteMany({ where: { teacherId: id } })
    await prisma.adminInstitutionAssignment.deleteMany({ where: { adminId: id } })
    await prisma.user.delete({ where: { id } })

    invalidateCache('stats')
    invalidateUserCache(id)
    res.json({ success: true, data: { message: 'User deleted successfully' } })
  } catch (error) {
    console.error('deleteUser error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete user' })
  }
}

// ─── Pending Users ─────────────────────────────────────────────────────────────

export async function getPendingUsers(req, res) {
  try {
    const pending = await prisma.user.findMany({
      where: { role: 'pending' },
      select: {
        id: true, name: true, email: true, avatarUrl: true, createdAt: true,
        institution: { select: { id: true, name: true, type: true, code: true } },
      },
      orderBy: { createdAt: 'desc' }, take: 100,
    })

    const grouped = {}
    pending.forEach(u => {
      const instId = u.institution?.id || 'unassigned'
      if (!grouped[instId]) {
        grouped[instId] = {
          institution: u.institution || { id: 'unassigned', name: 'No Institution', type: 'unknown' },
          users: [],
        }
      }
      grouped[instId].users.push(u)
    })

    res.json({ success: true, data: { users: pending, grouped: Object.values(grouped), total: pending.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

export async function bulkApproveUsers(req, res) {
  try {
    const { userIds, role } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required' })
    }

    const validRoles = ['principal', 'vice_principal', 'chairman', 'vice_chairman', 'dean', 'hod', 'teacher', 'student']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role for approval' })
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: userIds }, role: 'pending' },
      data: { role, isApproved: true },
    })

    invalidateCache('stats')
    userIds.forEach(id => invalidateUserCache(id))
    res.json({ success: true, data: { approved: result.count } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to bulk approve users' })
  }
}
