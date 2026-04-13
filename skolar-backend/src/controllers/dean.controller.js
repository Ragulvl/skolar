import prisma from '../config/prisma.js'

// ──────────────────────────────────────────────
// Helper: Get dept IDs managed by this Dean
// ──────────────────────────────────────────────
async function getDeanDeptIds(userId) {
  const depts = await prisma.department.findMany({
    where: { deanId: userId },
    select: { id: true },
  })
  return depts.map(d => d.id)
}

// ──────────────────────────────────────────────
// OVERVIEW
// ──────────────────────────────────────────────

export async function getDeanOverview(req, res) {
  try {
    const userId = req.user.id
    const departments = await prisma.department.findMany({
      where: { deanId: userId },
      include: { _count: { select: { users: true, subjects: true } } },
    })

    const deptIds = departments.map(d => d.id)
    if (deptIds.length === 0) {
      return res.json({ success: true, data: { departments: [], stats: { teachers: 0, students: 0, attendance: '0' } } })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [roleCounts, attendanceStats] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        where: { departmentId: { in: deptIds } },
        _count: true,
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          student: { departmentId: { in: deptIds } },
          date: { gte: today, lt: tomorrow },
        },
        _count: true,
      }),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })
    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    // Get HOD names
    const hodIds = departments.map(d => d.hodId).filter(Boolean)
    const hods = hodIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodIds } },
      select: { id: true, name: true },
      take: 50,
    }) : []
    const hodMap = {}
    hods.forEach(h => { hodMap[h.id] = h.name })

    res.json({
      success: true,
      data: {
        departments: departments.map(d => ({
          id: d.id, name: d.name,
          hodId: d.hodId, hodName: d.hodId ? hodMap[d.hodId] || '—' : '—',
          teachers: d._count.users, subjects: d._count.subjects,
        })),
        stats: {
          departments: departments.length,
          teachers: roleMap.teacher || 0,
          students: roleMap.student || 0,
          attendance: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
          todayStats: {
            present: attMap.present || 0,
            absent: attMap.absent || 0,
            late: attMap.late || 0,
            total: attTotal,
          },
        },
      },
    })
  } catch (error) {
    console.error('Dean overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dean overview' })
  }
}

// ──────────────────────────────────────────────
// DEPARTMENTS
// ──────────────────────────────────────────────

export async function getDeanDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      where: { deanId: req.user.id },
      include: { _count: { select: { users: true, subjects: true } } },
    })

    const hodIds = departments.map(d => d.hodId).filter(Boolean)
    const hods = hodIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodIds } },
      select: { id: true, name: true, email: true },
      take: 50,
    }) : []
    const hodMap = {}
    hods.forEach(h => { hodMap[h.id] = h })

    const result = departments.map(d => ({
      id: d.id, name: d.name,
      hod: d.hodId ? hodMap[d.hodId] || null : null,
      teachers: d._count.users, subjects: d._count.subjects,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

// ──────────────────────────────────────────────
// STAFF (with subject assignments)
// ──────────────────────────────────────────────

export async function getDeanStaff(req, res) {
  try {
    const deptIds = await getDeanDeptIds(req.user.id)
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = {
      departmentId: { in: deptIds },
      role: { in: ['hod', 'teacher'] },
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: {
        id: true, name: true, email: true, role: true,
        department: { select: { id: true, name: true } },
        teacherAssignments: {
          where: { isActive: true },
          include: { subject: { select: { id: true, name: true, department: { select: { name: true } } } } },
        },
      },
      orderBy: { name: 'asc' },
      take: limit + 1,
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
    res.status(500).json({ success: false, error: 'Failed to fetch staff' })
  }
}

// ──────────────────────────────────────────────
// STUDENTS
// ──────────────────────────────────────────────

export async function getDeanStudents(req, res) {
  try {
    const { departmentId, cursor, limit: rawLimit, search } = req.query
    const deptIds = await getDeanDeptIds(req.user.id)
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { role: 'student', departmentId: { in: deptIds } }
    if (departmentId && deptIds.includes(departmentId)) {
      where.departmentId = departmentId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: {
        id: true, name: true, email: true,
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      take: limit + 1,
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
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// ──────────────────────────────────────────────
// DAILY ATTENDANCE (with dept breakdown + 7-day trend)
// ──────────────────────────────────────────────

export async function getDeanAttendance(req, res) {
  try {
    const deptIds = await getDeanDeptIds(req.user.id)
    if (deptIds.length === 0) return res.json({ success: true, data: { daily: {}, departments: [], trend: [] } })

    const dateStr = req.query.date
    const selectedDate = dateStr ? new Date(dateStr) : new Date()
    selectedDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const trendStart = new Date(selectedDate)
    trendStart.setDate(trendStart.getDate() - 6)

    // Get department names
    const departments = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    })
    const deptNameMap = {}
    departments.forEach(d => { deptNameMap[d.id] = d.name })

    // Per-department daily stats
    const deptDailyRaw = await prisma.$queryRaw`
      SELECT u."departmentId", a."status", COUNT(*)::int as count
      FROM "Attendance" a
      JOIN "User" u ON a."studentId" = u."id"
      WHERE u."departmentId" = ANY(${deptIds})
        AND a."date" >= ${selectedDate}
        AND a."date" < ${nextDay}
      GROUP BY u."departmentId", a."status"
    `

    const deptStats = {}
    deptIds.forEach(id => {
      deptStats[id] = { departmentId: id, name: deptNameMap[id] || 'Unknown', present: 0, absent: 0, late: 0, total: 0 }
    })
    deptDailyRaw.forEach(r => {
      if (deptStats[r.departmentId]) {
        deptStats[r.departmentId][r.status] = r.count
        deptStats[r.departmentId].total += r.count
      }
    })
    Object.values(deptStats).forEach(d => {
      d.percentage = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : '0'
    })

    // Overall daily
    const overallPresent = Object.values(deptStats).reduce((a, d) => a + d.present, 0)
    const overallAbsent = Object.values(deptStats).reduce((a, d) => a + d.absent, 0)
    const overallLate = Object.values(deptStats).reduce((a, d) => a + d.late, 0)
    const overallTotal = overallPresent + overallAbsent + overallLate

    // 7-day trend (aggregated at DB level)
    const trendRaw = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: {
        student: { departmentId: { in: deptIds } },
        date: { gte: trendStart, lt: nextDay },
      },
      _count: true,
    })

    const trendMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trendMap[key] = { date: key, present: 0, absent: 0, late: 0, total: 0 }
    }
    trendRaw.forEach(r => {
      const key = r.date.toISOString().split('T')[0]
      if (trendMap[key]) {
        trendMap[key][r.status] = (trendMap[key][r.status] || 0) + r._count
        trendMap[key].total += r._count
      }
    })

    res.json({
      success: true,
      data: {
        date: selectedDate.toISOString().split('T')[0],
        daily: {
          present: overallPresent, absent: overallAbsent, late: overallLate,
          total: overallTotal,
          percentage: overallTotal > 0 ? ((overallPresent / overallTotal) * 100).toFixed(1) : '0',
        },
        departments: Object.values(deptStats),
        trend: Object.values(trendMap),
      },
    })
  } catch (error) {
    console.error('Dean attendance error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

// ──────────────────────────────────────────────
// SUBJECTS (all across managed depts)
// ──────────────────────────────────────────────

export async function getDeanSubjects(req, res) {
  try {
    const deptIds = await getDeanDeptIds(req.user.id)
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where: { departmentId: { in: deptIds } },
      include: {
        department: { select: { name: true } },
        teacherAssignments: {
          where: { isActive: true },
          include: { teacher: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
      take: limit + 1,
    }

    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.subject.findMany(query),
      prisma.subject.count({ where: { departmentId: { in: deptIds } } }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({ success: true, data: items, pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}

// ──────────────────────────────────────────────
// ASSIGN TEACHER (Dean can assign across managed depts)
// ──────────────────────────────────────────────

export async function deanAssignTeacher(req, res) {
  try {
    const { teacherId, subjectId } = req.body
    if (!teacherId || !subjectId) {
      return res.status(400).json({ success: false, error: 'teacherId and subjectId required' })
    }

    // Verify subject is in dean's managed departments
    const deptIds = await getDeanDeptIds(req.user.id)
    const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { departmentId: true } })
    if (!subject || !deptIds.includes(subject.departmentId)) {
      return res.status(403).json({ success: false, error: 'Subject not in your managed departments' })
    }

    // Check if already exists
    const existing = await prisma.teacherAssignment.findFirst({
      where: { teacherId, subjectId, isActive: true },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already assigned' })
    }

    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, subjectId },
    })

    // Also create cross-dept assignment if teacher's primary dept is different
    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { departmentId: true } })
    if (teacher && teacher.departmentId !== subject.departmentId) {
      await prisma.teacherDeptAssignment.upsert({
        where: { teacherId_departmentId: { teacherId, departmentId: subject.departmentId } },
        update: {},
        create: { teacherId, departmentId: subject.departmentId },
      })
    }

    res.status(201).json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign teacher' })
  }
}

// ──────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────

export async function getDeanReports(req, res) {
  try {
    const deptIds = await getDeanDeptIds(req.user.id)
    const departments = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    })

    const [attendanceStats, assessmentStats] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { departmentId: { in: deptIds } } },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { departmentId: { in: deptIds } } },
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
        attendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessments: {
          avgScore: assessmentStats._avg.score ? Math.round(assessmentStats._avg.score) : 0,
          totalResults: assessmentStats._count,
        },
        departments: departments.map(d => ({ id: d.id, name: d.name })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}
