import prisma from '../config/prisma.js'

// ──────────────────────────────────────────────
// GET /student/dashboard — Own data only
// ──────────────────────────────────────────────
export async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user.id
    const deptId = req.user.departmentId

    const [attendance, assessmentResults, subjects] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId },
        _count: true,
      }),
      prisma.assessmentResult.aggregate({
        where: { studentId },
        _avg: { score: true },
        _count: true,
      }),
      deptId
        ? prisma.subject.findMany({
            where: { departmentId: deptId },
            select: {
              id: true, name: true,
              teacherAssignments: {
                where: { isActive: true },
                select: { teacher: { select: { name: true } } },
              },
            },
          })
        : Promise.resolve([]),
    ])

    const attMap = {}
    attendance.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        attendance: {
          present: attMap.present || 0,
          absent: attMap.absent || 0,
          late: attMap.late || 0,
          total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
        assessments: {
          avgScore: assessmentResults._avg.score ? Math.round(assessmentResults._avg.score) : 0,
          totalTaken: assessmentResults._count,
        },
        subjects: subjects.map(s => ({
          id: s.id,
          name: s.name,
          teachers: (s.teacherAssignments || []).map(ta => ta.teacher.name),
        })),
      },
    })
  } catch (error) {
    console.error('Student dashboard error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' })
  }
}

// ──────────────────────────────────────────────
// GET /student/attendance — Own attendance only
// ──────────────────────────────────────────────
export async function getStudentOwnAttendance(req, res) {
  try {
    const studentId = req.user.id
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where: { studentId },
      include: { subject: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: limit + 1,
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.attendance.findMany(query),
      prisma.attendance.count({ where: { studentId } }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    // Group by date for calendar view
    const byDate = {}
    items.forEach(r => {
      const key = r.date.toISOString().split('T')[0]
      if (!byDate[key]) byDate[key] = { date: key, records: [] }
      byDate[key].records.push({
        subjectName: r.subject.name,
        status: r.status,
      })
    })

    // Overall stats
    const stats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true,
    })
    const attMap = {}
    stats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        records: Object.values(byDate),
        stats: {
          present: attMap.present || 0,
          absent: attMap.absent || 0,
          late: attMap.late || 0,
          total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
      },
      pagination: {
        total,
        hasMore,
        nextCursor: hasMore ? items[items.length - 1]?.id : null,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

// ──────────────────────────────────────────────
// GET /student/assessments — Own assessment results
// ──────────────────────────────────────────────
export async function getStudentAssessments(req, res) {
  try {
    const studentId = req.user.id
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where: { studentId },
      include: {
        assessment: {
          select: {
            id: true, title: true, type: true, dueDate: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit + 1,
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.assessmentResult.findMany(query),
      prisma.assessmentResult.count({ where: { studentId } }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true,
      data: items.map(r => ({
        id: r.id,
        assessmentTitle: r.assessment.title,
        assessmentType: r.assessment.type,
        subjectName: r.assessment.subject.name,
        score: r.score,
        submittedAt: r.submittedAt,
        dueDate: r.assessment.dueDate,
      })),
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// ──────────────────────────────────────────────
// GET /student/subjects — Subjects in own department
// ──────────────────────────────────────────────
export async function getStudentSubjects(req, res) {
  try {
    const deptId = req.user.departmentId
    const gradeId = req.user.gradeId

    let where = {}
    if (deptId) where.departmentId = deptId
    else if (gradeId) where.gradeId = gradeId
    else return res.json({ success: true, data: [] })

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        teacherAssignments: {
          where: { isActive: true },
          include: { teacher: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      data: subjects.map(s => ({
        id: s.id,
        name: s.name,
        teachers: s.teacherAssignments.map(ta => ta.teacher.name),
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}


// ──────────────────────────────────────────────
// GET /student/grades — Own grades/scores summary
// ──────────────────────────────────────────────
export async function getStudentGrades(req, res) {
  try {
    const studentId = req.user.id

    // Per-subject average score — load limited results
    const results = await prisma.assessmentResult.findMany({
      where: { studentId },
      include: {
        assessment: {
          select: { subject: { select: { id: true, name: true } } },
        },
      },
      take: 100,
    })

    const subjectScores = {}
    results.forEach(r => {
      const sid = r.assessment.subject.id
      if (!subjectScores[sid]) {
        subjectScores[sid] = { subjectId: sid, subjectName: r.assessment.subject.name, scores: [] }
      }
      subjectScores[sid].scores.push(r.score)
    })

    const grades = Object.values(subjectScores).map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
      testsCount: s.scores.length,
      highest: Math.max(...s.scores),
      lowest: Math.min(...s.scores),
    }))

    res.json({ success: true, data: grades })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch grades' })
  }
}
