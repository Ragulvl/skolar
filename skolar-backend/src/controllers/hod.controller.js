import prisma from '../config/prisma.js'

// ──────────────────────────────────────────────
// Helper: Get department ID for HOD
// ──────────────────────────────────────────────
async function getHODDeptId(req) {
  if (req.user.departmentId) return req.user.departmentId
  const dept = await prisma.department.findFirst({ where: { hodId: req.user.id }, select: { id: true } })
  return dept?.id || null
}

// ──────────────────────────────────────────────
// OVERVIEW
// ──────────────────────────────────────────────

export async function getHODOverview(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: { teachers: 0, students: 0, subjects: 0, assessments: 0, attendance: '0' } })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [teachers, students, subjects, assessments, todayAttendance] = await Promise.all([
      prisma.user.count({ where: { departmentId: deptId, role: 'teacher' } }),
      prisma.user.count({ where: { departmentId: deptId, role: 'student' } }),
      prisma.subject.count({ where: { departmentId: deptId } }),
      prisma.assessment.count({ where: { subject: { departmentId: deptId } } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          student: { departmentId: deptId },
          date: { gte: today, lt: tomorrow },
        },
        _count: true,
      }),
    ])

    const attMap = {}
    todayAttendance.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        departmentId: deptId,
        teachers, students, subjects, assessments,
        attendance: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        todayStats: {
          present: attMap.present || 0,
          absent: attMap.absent || 0,
          late: attMap.late || 0,
          total: attTotal,
        },
      },
    })
  } catch (error) {
    console.error('HOD overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch HOD overview' })
  }
}

// ──────────────────────────────────────────────
// TEACHERS (with subject assignments)
// ──────────────────────────────────────────────

export async function getHODTeachers(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: [] })

    const teachers = await prisma.user.findMany({
      where: { departmentId: deptId, role: 'teacher' },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        teacherAssignments: {
          where: { isActive: true },
          include: { subject: { select: { id: true, name: true, departmentId: true } } },
        },
        teacherDeptAssignments: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({ success: true, data: teachers })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' })
  }
}

// ──────────────────────────────────────────────
// SUBJECTS (with assigned teachers)
// ──────────────────────────────────────────────

export async function getHODSubjects(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: [] })

    const subjects = await prisma.subject.findMany({
      where: { departmentId: deptId },
      include: {
        teacherAssignments: {
          where: { isActive: true },
          include: { teacher: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { assessments: true, attendances: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: subjects })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}

// ──────────────────────────────────────────────
// STUDENTS
// ──────────────────────────────────────────────

export async function getHODStudents(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: [] })

    const students = await prisma.user.findMany({
      where: { departmentId: deptId, role: 'student' },
      select: { id: true, name: true, email: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// ──────────────────────────────────────────────
// ATTENDANCE (daily with date filter + 7-day trend)
// ──────────────────────────────────────────────

export async function getHODAttendance(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: { daily: {}, trend: [], subjects: [] } })

    // Parse date (default: today)
    const dateStr = req.query.date
    const selectedDate = dateStr ? new Date(dateStr) : new Date()
    selectedDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // 7-day range for trend
    const trendStart = new Date(selectedDate)
    trendStart.setDate(trendStart.getDate() - 6)

    // Parallel queries
    const [dailyStats, trendData, subjectBreakdown] = await Promise.all([
      // Today's stats
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          student: { departmentId: deptId },
          date: { gte: selectedDate, lt: nextDay },
        },
        _count: true,
      }),
      // 7-day trend (raw records, we'll aggregate in JS)
      prisma.attendance.findMany({
        where: {
          student: { departmentId: deptId },
          date: { gte: trendStart, lt: nextDay },
        },
        select: { date: true, status: true },
      }),
      // Per-subject breakdown for selected date
      prisma.attendance.groupBy({
        by: ['subjectId', 'status'],
        where: {
          student: { departmentId: deptId },
          date: { gte: selectedDate, lt: nextDay },
        },
        _count: true,
      }),
    ])

    // Process daily stats
    const dailyMap = {}
    dailyStats.forEach(a => { dailyMap[a.status] = a._count })
    const dailyTotal = Object.values(dailyMap).reduce((a, b) => a + b, 0)

    // Process 7-day trend
    const trendMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trendMap[key] = { date: key, present: 0, absent: 0, late: 0, total: 0 }
    }
    trendData.forEach(r => {
      const key = r.date.toISOString().split('T')[0]
      if (trendMap[key]) {
        trendMap[key][r.status] = (trendMap[key][r.status] || 0) + 1
        trendMap[key].total++
      }
    })

    // Process subject breakdown
    const subjectMap = {}
    subjectBreakdown.forEach(s => {
      if (!subjectMap[s.subjectId]) subjectMap[s.subjectId] = { subjectId: s.subjectId, present: 0, absent: 0, late: 0, total: 0 }
      subjectMap[s.subjectId][s.status] = s._count
      subjectMap[s.subjectId].total += s._count
    })

    // Get subject names
    const subjectIds = Object.keys(subjectMap)
    const subjectNames = subjectIds.length > 0
      ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : []
    const nameMap = {}
    subjectNames.forEach(s => { nameMap[s.id] = s.name })

    const subjectList = Object.values(subjectMap).map(s => ({
      ...s,
      name: nameMap[s.subjectId] || 'Unknown',
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0',
    }))

    res.json({
      success: true,
      data: {
        date: selectedDate.toISOString().split('T')[0],
        daily: {
          present: dailyMap.present || 0,
          absent: dailyMap.absent || 0,
          late: dailyMap.late || 0,
          total: dailyTotal,
          percentage: dailyTotal > 0 ? ((dailyMap.present || 0) / dailyTotal * 100).toFixed(1) : '0',
        },
        trend: Object.values(trendMap),
        subjects: subjectList,
      },
    })
  } catch (error) {
    console.error('HOD attendance error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

// ──────────────────────────────────────────────
// ASSESSMENTS
// ──────────────────────────────────────────────

export async function getHODAssessments(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: [] })

    const assessments = await prisma.assessment.findMany({
      where: { subject: { departmentId: deptId } },
      include: {
        subject: { select: { name: true } },
        creator: { select: { name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: assessments })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// ──────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────

export async function getHODReports(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: {} })

    const [attendanceStats, assessmentAvg, teachers, students] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { departmentId: deptId } },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { student: { departmentId: deptId } },
        _avg: { score: true },
        _count: true,
      }),
      prisma.user.count({ where: { departmentId: deptId, role: 'teacher' } }),
      prisma.user.count({ where: { departmentId: deptId, role: 'student' } }),
    ])

    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        teachers, students,
        attendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessments: {
          avgScore: assessmentAvg._avg.score ? Math.round(assessmentAvg._avg.score) : 0,
          totalResults: assessmentAvg._count,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}

// ──────────────────────────────────────────────
// TEACHER–SUBJECT ASSIGNMENTS
// ──────────────────────────────────────────────

// POST /hod/assign-subject — assign a teacher to a subject
export async function assignSubjectToTeacher(req, res) {
  try {
    const { teacherId, subjectId } = req.body
    if (!teacherId || !subjectId) {
      return res.status(400).json({ success: false, error: 'teacherId and subjectId required' })
    }

    // Check if assignment already exists
    const existing = await prisma.teacherAssignment.findFirst({
      where: { teacherId, subjectId, isActive: true },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'This teacher is already assigned to this subject' })
    }

    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, subjectId },
    })
    res.status(201).json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign subject' })
  }
}

// DELETE /hod/assignments/:id — remove an assignment
export async function removeAssignment(req, res) {
  try {
    const { id } = req.params
    await prisma.teacherAssignment.update({
      where: { id },
      data: { isActive: false },
    })
    res.json({ success: true, data: { message: 'Assignment removed' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove assignment' })
  }
}

// POST /hod/subjects — create a new subject
export async function createHODSubject(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.status(400).json({ success: false, error: 'No department found' })

    const { name } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Subject name is required' })

    const subject = await prisma.subject.create({
      data: { name, departmentId: deptId, institutionId: req.user.institutionId },
    })
    res.status(201).json({ success: true, data: subject })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create subject' })
  }
}

// GET /hod/available-teachers — teachers in dept (for assignment dropdown)
export async function getAvailableTeachers(req, res) {
  try {
    const deptId = await getHODDeptId(req)
    if (!deptId) return res.json({ success: true, data: [] })

    // Get teachers from this department + teachers assigned to this dept via TeacherDeptAssignment
    const [deptTeachers, crossDeptTeachers] = await Promise.all([
      prisma.user.findMany({
        where: { departmentId: deptId, role: 'teacher' },
        select: { id: true, name: true, email: true },
      }),
      prisma.teacherDeptAssignment.findMany({
        where: { departmentId: deptId },
        include: { teacher: { select: { id: true, name: true, email: true } } },
      }),
    ])

    const teacherMap = new Map()
    deptTeachers.forEach(t => teacherMap.set(t.id, t))
    crossDeptTeachers.forEach(a => teacherMap.set(a.teacher.id, a.teacher))

    res.json({ success: true, data: Array.from(teacherMap.values()) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch available teachers' })
  }
}
