import prisma from '../../config/prisma.js'

// ═══════════════════════════════════════════════
// GET /college-admin/staff
// ═══════════════════════════════════════════════

export async function getStaff(req, res) {
  try {
    const instId = req.user.institutionId
    const { departmentId, role: filterRole, cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { institutionId: instId, role: { in: ['principal', 'vice_principal', 'dean', 'hod', 'teacher'] } }
    if (departmentId) where.departmentId = departmentId
    if (filterRole) where.role = filterRole
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: {
        id: true, name: true, email: true, role: true, avatarUrl: true,
        department: { select: { id: true, name: true } },
        teacherAssignments: { where: { isActive: true }, include: { subject: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' }, take: limit + 1,
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([prisma.user.findMany(query), prisma.user.count({ where })])
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true, data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/students
// ═══════════════════════════════════════════════

export async function getStudents(req, res) {
  try {
    const instId = req.user.institutionId
    const { departmentId, cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { institutionId: instId, role: 'student' }
    if (departmentId) where.departmentId = departmentId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: { id: true, name: true, email: true, department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' }, take: limit + 1,
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([prisma.user.findMany(query), prisma.user.count({ where })])
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true, data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId/teachers/:teacherId
// ═══════════════════════════════════════════════

export async function getTeacherProfile(req, res) {
  try {
    const { teacherId } = req.params

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true,
        department: { select: { id: true, name: true } },
        teacherAssignments: {
          where: { isActive: true },
          include: { subject: { select: { id: true, name: true, department: { select: { name: true } } } } },
        },
      },
    })
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, error: 'Teacher not found' })
    }

    const attendanceStats = await prisma.attendance.groupBy({
      by: ['date'], where: { teacherId }, _count: true, orderBy: { date: 'desc' }, take: 30,
    })

    const assessments = await prisma.assessment.findMany({
      where: { createdBy: teacherId },
      include: { subject: { select: { name: true } }, _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' }, take: 20,
    })

    const subjectIds = teacher.teacherAssignments.map(a => a.subject.id)
    const subjectPerformance = subjectIds.length > 0 ? await prisma.assessmentResult.groupBy({
      by: ['assessmentId'],
      where: { assessment: { subjectId: { in: subjectIds } } },
      _avg: { score: true }, _count: true,
    }) : []

    res.json({
      success: true,
      data: {
        ...teacher,
        attendanceDays: attendanceStats.length,
        lastMarked: attendanceStats[0]?.date || null,
        attendanceHistory: attendanceStats.map(a => ({ date: a.date, records: a._count })),
        assessments, assessmentsCreated: assessments.length,
        subjectAvgScores: subjectPerformance,
      },
    })
  } catch (error) {
    console.error('Teacher profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch teacher profile' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId/students/:studentId
// ═══════════════════════════════════════════════

export async function getStudentProfile(req, res) {
  try {
    const { studentId } = req.params

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true,
        department: { select: { id: true, name: true } },
      },
    })
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const attendanceRaw = await prisma.attendance.findMany({
      where: { studentId }, include: { subject: { select: { id: true, name: true } } }, take: 100,
    })
    const subjectAttMap = {}
    attendanceRaw.forEach(a => {
      if (!subjectAttMap[a.subjectId]) {
        subjectAttMap[a.subjectId] = { subjectId: a.subjectId, name: a.subject.name, present: 0, absent: 0, late: 0, total: 0 }
      }
      subjectAttMap[a.subjectId][a.status] = (subjectAttMap[a.subjectId][a.status] || 0) + 1
      subjectAttMap[a.subjectId].total++
    })
    const attendanceBySubject = Object.values(subjectAttMap).map(s => ({
      ...s, percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0',
    }))

    const assessmentResults = await prisma.assessmentResult.findMany({
      where: { studentId },
      include: { assessment: { select: { title: true, type: true, subject: { select: { name: true } }, dueDate: true } } },
      orderBy: { submittedAt: 'desc' }, take: 100,
    })

    const totalAtt = attendanceRaw.length
    const totalPresent = attendanceRaw.filter(a => a.status === 'present').length
    const avgScore = assessmentResults.length > 0
      ? (assessmentResults.reduce((sum, r) => sum + r.score, 0) / assessmentResults.length).toFixed(1)
      : '0'

    res.json({
      success: true,
      data: {
        ...student,
        overallStats: {
          attendancePercentage: totalAtt > 0 ? ((totalPresent / totalAtt) * 100).toFixed(1) : '0',
          totalAssessments: assessmentResults.length, avgScore,
        },
        attendanceBySubject, assessmentResults,
      },
    })
  } catch (error) {
    console.error('Student profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch student profile' })
  }
}

// ═══════════════════════════════════════════════
// Pending, Assessments, Approve, Reject
// ═══════════════════════════════════════════════

export async function getAssessments(req, res) {
  try {
    const instId = req.user.institutionId
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)
    const where = { creator: { institutionId: instId } }

    const query = {
      where,
      include: {
        subject: { select: { name: true, department: { select: { name: true } } } },
        creator: { select: { name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { createdAt: 'desc' }, take: limit + 1,
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([prisma.assessment.findMany(query), prisma.assessment.count({ where })])
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true, data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('College admin assessments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

export async function getPending(req, res) {
  try {
    const pending = await prisma.user.findMany({
      where: { institutionId: req.user.institutionId, role: 'pending' },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    res.json({ success: true, data: pending })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' })
  }
}

export async function approveUser(req, res) {
  try {
    const { userId, role } = req.body
    if (!userId || !role) return res.status(400).json({ success: false, error: 'userId and role required' })
    const user = await prisma.user.update({ where: { id: userId }, data: { role, isApproved: true } })
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve user' })
  }
}

export async function rejectUser(req, res) {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' })
    await prisma.user.delete({ where: { id: userId } })
    res.json({ success: true, data: { message: 'User rejected and removed' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject user' })
  }
}
