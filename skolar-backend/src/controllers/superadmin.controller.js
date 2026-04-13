import prisma from '../config/prisma.js'
import { generateInstitutionCode } from '../utils/codeGenerator.utils.js'
import { invalidateUserCache } from '../middleware/auth.middleware.js'

// ─── Response Cache ─────────────────────────────────────────────────────────────
// Simple in-memory TTL cache for read-heavy endpoints that rarely change.
// Eliminates redundant DB work when multiple admins view the same dashboard.
const responseCache = new Map()

function getCached(key, ttlMs = 30_000) {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) {
    responseCache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key, data) {
  responseCache.set(key, { data, ts: Date.now() })
}

// Invalidate cache entries matching a prefix (e.g., after a mutation)
function invalidateCache(prefix) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) responseCache.delete(key)
  }
}

// ─── Institutions ──────────────────────────────────────────────────────────────

export async function getInstitutions(req, res) {
  try {
    const { type, cursor, limit: rawLimit, search } = req.query
    const where = {}
    if (type === 'school' || type === 'college') where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        type: true,
        isActive: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.institution.findMany(query),
      prisma.institution.count({ where }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        hasMore,
        nextCursor: hasMore ? items[items.length - 1]?.id : null,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch institutions' })
  }
}

export async function getPlatformStats(req, res) {
  try {
    // Check cache first (30s TTL)
    const cached = getCached('stats')
    if (cached) return res.json({ success: true, data: cached })

    // Combine role counts into a single groupBy instead of 5 separate count() calls
    const [instCounts, roleCounts, assessments, attendance] = await Promise.all([
      prisma.institution.groupBy({ by: ['type'], _count: true }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.assessment.count(),
      prisma.attendance.count(),
    ])

    // Derive counts from groupBy results
    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    const instMap = {}
    instCounts.forEach(i => { instMap[i.type] = i._count })

    const data = {
      total: (instMap.school || 0) + (instMap.college || 0),
      schools: instMap.school || 0,
      colleges: instMap.college || 0,
      users: Object.values(roleMap).reduce((a, b) => a + b, 0),
      pending: roleMap.pending || 0,
      teachers: roleMap.teacher || 0,
      students: roleMap.student || 0,
      admins: roleMap.admin || 0,
      assessments,
      attendance,
    }

    setCache('stats', data)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

export async function createInstitution(req, res) {
  try {
    const { name, type, city } = req.body
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' })
    }

    const count = await prisma.institution.count({ where: { type } })
    const code = generateInstitutionCode(type, count)

    const institution = await prisma.institution.create({
      data: { name, type, code, city }
    })

    invalidateCache('stats')
    res.status(201).json({ success: true, data: institution })
  } catch (error) {
    console.error('Create institution error:', error)
    res.status(500).json({ success: false, error: 'Failed to create institution' })
  }
}

export async function updateInstitution(req, res) {
  try {
    const { id } = req.params
    const updates = req.body

    const institution = await prisma.institution.update({
      where: { id },
      data: updates,
    })

    res.json({ success: true, data: institution })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update institution' })
  }
}

export async function deleteInstitution(req, res) {
  try {
    const { id } = req.params

    // Cascade: remove all related data first
    // 1. Remove admin assignments for this institution
    await prisma.adminInstitutionAssignment.deleteMany({ where: { institutionId: id } })
    // 2. Remove teacher assignments for sections in this institution
    const sections = await prisma.section.findMany({ where: { institutionId: id }, select: { id: true } })
    const sectionIds = sections.map(s => s.id)
    if (sectionIds.length > 0) {
      await prisma.teacherAssignment.deleteMany({ where: { sectionId: { in: sectionIds } } })
    }
    // 3. Remove sections
    await prisma.section.deleteMany({ where: { institutionId: id } })
    // 4. Remove subjects
    await prisma.subject.deleteMany({ where: { institutionId: id } })
    // 5. Remove departments
    await prisma.teacherDeptAssignment.deleteMany({
      where: { department: { institutionId: id } }
    })
    await prisma.department.deleteMany({ where: { institutionId: id } })
    // 6. Handle users — delete related user data then users (batched for large institutions)
    let userCursor = undefined
    const BATCH = 500
    while (true) {
      const batch = await prisma.user.findMany({
        where: { institutionId: id },
        select: { id: true },
        take: BATCH,
        ...(userCursor ? { cursor: { id: userCursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
      })
      if (batch.length === 0) break
      const batchIds = batch.map(u => u.id)
      userCursor = batch[batch.length - 1].id

      await prisma.attendance.deleteMany({ where: { OR: [{ studentId: { in: batchIds } }, { teacherId: { in: batchIds } }] } })
      await prisma.assessmentResult.deleteMany({ where: { studentId: { in: batchIds } } })

      const assessments = await prisma.assessment.findMany({ where: { createdBy: { in: batchIds } }, select: { id: true }, take: 5000 })
      const assessmentIds = assessments.map(a => a.id)
      if (assessmentIds.length > 0) {
        await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
        await prisma.assessmentResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
        await prisma.assessment.deleteMany({ where: { id: { in: assessmentIds } } })
      }
      await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: batchIds } } })
      await prisma.teacherDeptAssignment.deleteMany({ where: { teacherId: { in: batchIds } } })
    }
    await prisma.user.deleteMany({ where: { institutionId: id } })
    // 7. Finally delete the institution
    await prisma.institution.delete({ where: { id } })

    invalidateCache('stats')
    invalidateCache('analytics')
    res.json({ success: true, data: { message: 'Institution and all related data deleted' } })
  } catch (error) {
    console.error('Delete institution error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete institution' })
  }
}

// ─── Institution Detail (Deep Dive) ────────────────────────────────────────────

export async function getInstitutionDetail(req, res) {
  try {
    const { id } = req.params

    // Run ALL queries in parallel instead of sequentially
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
    console.error('Institution detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch institution details' })
  }
}

// ─── Admin Management ──────────────────────────────────────────────────────────

export async function getAdmins(req, res) {
  try {
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { role: 'admin' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        adminAssignments: {
          include: {
            institution: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where }),
    ])
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    // Map to expected shape (assignments instead of adminAssignments)
    const result = items.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt,
      assignments: admin.adminAssignments,
    }))

    res.json({
      success: true,
      data: result,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch admins' })
  }
}

export async function createAdmin(req, res) {
  try {
    const { name, email } = req.body
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' })
    }

    const admin = await prisma.user.create({
      data: { name, email, role: 'admin', isApproved: true }
    })

    invalidateCache('stats')
    res.status(201).json({ success: true, data: { id: admin.id, name: admin.name, email: admin.email } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create admin' })
  }
}

export async function deleteAdmin(req, res) {
  try {
    const { id } = req.params
    await prisma.adminInstitutionAssignment.deleteMany({ where: { adminId: id } })
    await prisma.user.delete({ where: { id } })
    invalidateCache('stats')
    invalidateUserCache(id)
    res.json({ success: true, data: { message: 'Admin deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete admin' })
  }
}

export async function assignInstitution(req, res) {
  try {
    const { adminId, institutionId, isActive } = req.body

    const assignment = await prisma.adminInstitutionAssignment.upsert({
      where: { adminId_institutionId: { adminId, institutionId } },
      update: { isActive },
      create: { adminId, institutionId, isActive },
    })

    res.json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign institution' })
  }
}

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
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isApproved: true,
        createdAt: true,
        institution: { select: { id: true, name: true, type: true, code: true } },
      },
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

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
    console.error('getAllUsers error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params

    // Fetch user with lightweight includes — use _count and aggregation
    // instead of loading entire arrays of attendance records
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
          // Only fetch limited recent results — not the WHOLE array
          assessmentResults: {
            select: { score: true, assessment: { select: { title: true } } },
            orderBy: { submittedAt: 'desc' },
            take: 20,
          },
        },
      }),
      // Use aggregate for attendance instead of loading every record
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

    // Compute attendance summary from groupBy (no array loading)
    const attendanceMap = {}
    attendanceStats.forEach(a => { attendanceMap[a.status] = a._count })
    const totalAttendance = Object.values(attendanceMap).reduce((a, b) => a + b, 0)
    const presentCount = attendanceMap.present || 0
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null

    // Avg score from aggregate (no array loading)
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

    // Only force isApproved=false when changing TO 'pending'.
    // For all other role changes, preserve the current approval status.
    const updateData = { role }
    if (role === 'pending') {
      updateData.isApproved = false
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
      where: { id },
      data: { isApproved },
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

    // Prevent deleting self
    if (req.user.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' })
    }

    // Cascade clean related data
    await prisma.attendance.deleteMany({ where: { OR: [{ studentId: id }, { teacherId: id }] } })
    await prisma.assessmentResult.deleteMany({ where: { studentId: id } })

    // Delete assessments created by this user
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

// ─── Pending Users (Centralized Hub) ───────────────────────────────────────────

export async function getPendingUsers(req, res) {
  try {
    const pending = await prisma.user.findMany({
      where: { role: 'pending' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        institution: { select: { id: true, name: true, type: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Group by institution
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
    // Invalidate cache for all affected users
    userIds.forEach(id => invalidateUserCache(id))
    res.json({ success: true, data: { approved: result.count } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to bulk approve users' })
  }
}

// ─── Enhanced Analytics ────────────────────────────────────────────────────────

export async function getEnhancedAnalytics(req, res) {
  try {
    // Check cache first (60s TTL — analytics data doesn't change frequently)
    const cached = getCached('analytics', 60_000)
    if (cached) return res.json({ success: true, data: cached })

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Run ALL independent queries in parallel instead of sequentially
    const [
      roleDistribution,
      institutionUsers,
      attendanceStats,
      totalAssessments,
      totalResults,
      avgScore,
      institutionCities,
      monthlySignupData,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.institution.findMany({
        select: { id: true, name: true, type: true, _count: { select: { users: true } } },
        orderBy: { users: { _count: 'desc' } },
        take: 10,
      }),
      prisma.attendance.groupBy({ by: ['status'], _count: true }),
      prisma.assessment.count(),
      prisma.assessmentResult.count(),
      prisma.assessmentResult.aggregate({ _avg: { score: true } }),
      // Use groupBy on city instead of fetching ALL institutions
      prisma.institution.groupBy({
        by: ['city'],
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
      // Monthly signups — aggregate at DB level, never load individual rows
      prisma.$queryRaw`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY month
      `,
    ])

    // Process region data from groupBy
    const regionData = institutionCities.map(i => ({
      city: i.city || 'Unknown',
      count: i._count,
    }))

    // monthlySignupData is already aggregated
    const monthlySignups = monthlySignupData

    const data = {
      roleDistribution: roleDistribution.map(r => ({ role: r.role, count: r._count })),
      institutionUsers: institutionUsers.map(i => ({ name: i.name, type: i.type, users: i._count.users })),
      attendanceStats: attendanceStats.reduce((acc, a) => { acc[a.status] = a._count; return acc }, {}),
      assessmentStats: { total: totalAssessments, results: totalResults, avgScore: avgScore._avg.score },
      regionData,
      monthlySignups,
    }

    setCache('analytics', data)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Enhanced analytics error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' })
  }
}

// ─── Platform Activity Feed ────────────────────────────────────────────────────

export async function getPlatformActivity(req, res) {
  try {
    // Check cache (30s TTL)
    const cached = getCached('activity')
    if (cached) return res.json({ success: true, data: cached })

    // Run both queries in parallel
    const [recentSignups, recentInstitutions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          createdAt: true,
          institution: { select: { name: true, type: true } },
        },
      }),
      prisma.institution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, type: true, code: true, createdAt: true },
      }),
    ])

    // Merge into unified activity feed, sorted by createdAt
    const activity = [
      ...recentSignups.map(u => ({
        type: u.role === 'pending' ? 'user_signup' : 'user_approved',
        message: u.role === 'pending'
          ? `${u.name} signed up at ${u.institution?.name || 'Unknown'}`
          : `${u.name} was approved as ${u.role.replace(/_/g, ' ')}`,
        timestamp: u.createdAt,
        meta: { userId: u.id, role: u.role, institution: u.institution?.name },
      })),
      ...recentInstitutions.map(i => ({
        type: 'institution_created',
        message: `${i.name} (${i.type}) was created`,
        timestamp: i.createdAt,
        meta: { institutionId: i.id, code: i.code },
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15)

    setCache('activity', activity)
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activity' })
  }
}

// ─── Platform Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  platform_name: 'Skolar',
  allow_signups: 'true',
  maintenance_mode: 'false',
  max_institutions_per_admin: '10',
  default_pending_timeout_days: '30',
}

export async function getPlatformSettings(req, res) {
  try {
    const settings = await prisma.platformSetting.findMany()
    const settingsMap = { ...DEFAULT_SETTINGS }
    settings.forEach(s => { settingsMap[s.key] = s.value })

    res.json({ success: true, data: settingsMap })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' })
  }
}

export async function updatePlatformSettings(req, res) {
  try {
    const updates = req.body // { key: value, key: value }

    const validKeys = Object.keys(DEFAULT_SETTINGS)
    const results = []

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue
      const setting = await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
      results.push(setting)
    }

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' })
  }
}
