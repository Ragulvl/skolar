import prisma from '../config/prisma.js'

// ═══════════════════════════════════════════════
// POST /assessments/create — Teacher/HOD/Dean creates assessment
// ═══════════════════════════════════════════════

export async function createAssessment(req, res) {
  try {
    const { title, type, subjectId, dueDate, questions } = req.body
    const assessment = await prisma.assessment.create({
      data: {
        title,
        type: type || 'quiz',
        subjectId,
        createdBy: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        questions: {
          create: (questions || []).map((q, i) => ({
            question: q.question,
            options: q.options || [],
            answer: q.answer || '',
            correctAnswer: q.correctAnswer || q.answer || '',
            points: q.points || 1,
            order: i,
          })),
        },
      },
      include: { questions: true },
    })
    res.status(201).json({ success: true, data: assessment })
  } catch (error) {
    console.error('Create assessment error:', error)
    res.status(500).json({ success: false, error: 'Failed to create assessment' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments — Teacher / HOD / Dean assessments (CURSOR PAGINATED)
// ═══════════════════════════════════════════════

export async function getMyAssessments(req, res) {
  try {
    const { role } = req.user
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)
    const where = {}

    if (role === 'teacher') {
      where.createdBy = req.user.id
    } else if (role === 'hod') {
      const deptId = req.user.departmentId
      if (deptId) where.subject = { departmentId: deptId }
    } else if (role === 'dean') {
      const depts = await prisma.department.findMany({
        where: { deanId: req.user.id },
        select: { id: true },
      })
      const deptIds = depts.map(d => d.id)
      if (deptIds.length > 0) where.subject = { departmentId: { in: deptIds } }
      else return res.json({ success: true, data: [], pagination: { total: 0, hasMore: false, nextCursor: null } })
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const query = {
      where,
      include: {
        subject: { select: { id: true, name: true, department: { select: { name: true } } } },
        creator: { select: { name: true } },
        _count: { select: { results: true, questions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.assessment.findMany(query),
      prisma.assessment.count({ where }),
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
    console.error('My assessments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/detail/:assessmentId — full detail with questions + results
// ═══════════════════════════════════════════════

export async function getAssessmentDetail(req, res) {
  try {
    const { assessmentId } = req.params
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        subject: { select: { name: true, department: { select: { name: true } } } },
        creator: { select: { name: true } },
        results: {
          include: { student: { select: { id: true, name: true, email: true } } },
          orderBy: { score: 'desc' },
          take: 200,
        },
      },
    })
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' })

    const avg = assessment.results.length > 0
      ? assessment.results.reduce((s, r) => s + r.score, 0) / assessment.results.length
      : 0

    res.json({
      success: true,
      data: {
        ...assessment,
        stats: { total: assessment.results.length, average: Math.round(avg) },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessment detail' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/subjects — subjects scoped by role
// ═══════════════════════════════════════════════

export async function getAssessableSubjects(req, res) {
  try {
    const { role } = req.user
    let where = {}

    if (role === 'teacher') {
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: req.user.id, isActive: true },
        select: { subjectId: true },
      })
      where.id = { in: assignments.map(a => a.subjectId) }
    } else if (role === 'hod') {
      where.departmentId = req.user.departmentId
    } else if (role === 'dean') {
      const depts = await prisma.department.findMany({
        where: { deanId: req.user.id },
        select: { id: true },
      })
      where.departmentId = { in: depts.map(d => d.id) }
    }

    const subjects = await prisma.subject.findMany({
      where,
      select: { id: true, name: true, department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      take: 100,
    })
  
    res.json({ success: true, data: subjects })
  } catch (error) {
    console.error('Assessment subjects error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/pending — student's assessments (CURSOR PAGINATED)
// ═══════════════════════════════════════════════

export async function getStudentPendingAssessments(req, res) {
  try {
    const studentId = req.user.id
    const deptId = req.user.departmentId
    const gradeId = req.user.gradeId
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    let subjectWhere = {}
    if (deptId) subjectWhere.departmentId = deptId
    else if (gradeId) subjectWhere.gradeId = gradeId
    else return res.json({ success: true, data: { pending: [], completed: [] }, pagination: { total: 0, hasMore: false, nextCursor: null } })

    const query = {
      where: { subject: subjectWhere },
      include: {
        subject: { select: { name: true } },
        creator: { select: { name: true } },
        _count: { select: { questions: true } },
        results: { where: { studentId }, select: { id: true, score: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.assessment.findMany(query),
      prisma.assessment.count({ where: { subject: subjectWhere } }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    const pending = []
    const completed = []

    items.forEach(a => {
      if (a.results.length > 0) {
        completed.push({
          id: a.id, title: a.title, type: a.type, dueDate: a.dueDate,
          subjectName: a.subject.name, creatorName: a.creator.name,
          questionCount: a._count.questions,
          score: a.results[0].score, submittedAt: a.results[0].submittedAt,
        })
      } else {
        pending.push({
          id: a.id, title: a.title, type: a.type, dueDate: a.dueDate,
          subjectName: a.subject.name, creatorName: a.creator.name,
          questionCount: a._count.questions,
        })
      }
    })

    res.json({
      success: true,
      data: { pending, completed },
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('Student pending assessments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/take/:assessmentId — get questions for student
// ═══════════════════════════════════════════════

export async function getAssessmentForStudent(req, res) {
  try {
    const { assessmentId } = req.params
    const studentId = req.user.id

    const existing = await prisma.assessmentResult.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId } },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already submitted', data: { score: existing.score } })
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        subject: { select: { name: true } },
        questions: {
          select: { id: true, question: true, options: true },
        },
      },
    })
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' })

    res.json({ success: true, data: assessment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessment' })
  }
}

// ═══════════════════════════════════════════════
// POST /assessments/submit — student submits answers
// ═══════════════════════════════════════════════

export async function submitAssessment(req, res) {
  try {
    const { assessmentId, answers } = req.body
    const studentId = req.user.id

    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
    })
    if (questions.length === 0) {
      return res.status(400).json({ success: false, error: 'No questions in this assessment' })
    }

    let correct = 0
    questions.forEach(q => {
      const studentAnswer = answers?.[q.id]
      if (studentAnswer && studentAnswer === q.answer) correct++
    })
    const score = Math.round((correct / questions.length) * 100)

    const result = await prisma.assessmentResult.create({
      data: { assessmentId, studentId, score, answers: answers || {} },
    })
    res.status(201).json({ success: true, data: { ...result, correct, total: questions.length } })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Already submitted' })
    }
    console.error('Submit assessment error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit assessment' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/subject/:subjectId — (CURSOR PAGINATED)
// ═══════════════════════════════════════════════

export async function getAssessmentsBySubject(req, res) {
  try {
    const { subjectId } = req.params
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where: { subjectId },
      include: { _count: { select: { results: true } }, questions: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const [items, total] = await Promise.all([
      prisma.assessment.findMany(query),
      prisma.assessment.count({ where: { subjectId } }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true,
      data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/results/:studentId — (CURSOR PAGINATED)
// ═══════════════════════════════════════════════

export async function getStudentResults(req, res) {
  try {
    const { studentId } = req.params
    const { cursor, limit: rawLimit } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where: { studentId },
      include: { assessment: { include: { subject: { select: { name: true } } } } },
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
      data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch results' })
  }
}

// ═══════════════════════════════════════════════
// GET /assessments/report/:assessmentId — Needs all for avg
// ═══════════════════════════════════════════════

export async function getAssessmentReport(req, res) {
  try {
    const { assessmentId } = req.params
    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { score: 'desc' },
      take: 200,
    })
    const avg = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0
    res.json({ success: true, data: { results, average: avg.toFixed(1), total: results.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
}
