import prisma from '../config/prisma.js'

export async function createAssessment(req, res) {
  try {
    const { title, type, subjectId, dueDate, questions } = req.body
    const assessment = await prisma.assessment.create({
      data: {
        title, type, subjectId, dueDate: new Date(dueDate),
        createdBy: req.user.id,
        questions: questions?.length ? { create: questions.map(q => ({
          question: q.question,
          options: q.options || null,
          answer: q.answer || null,
        })) } : undefined,
      },
      include: { questions: true, subject: { select: { name: true } } },
    })
    res.status(201).json({ success: true, data: assessment })
  } catch (error) {
    console.error('Create assessment error:', error)
    res.status(500).json({ success: false, error: 'Failed to create assessment' })
  }
}

// GET /assessments/my — teacher/hod/dean's created assessments
export async function getMyAssessments(req, res) {
  try {
    const role = req.user.role
    let where = {}

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
      else return res.json({ success: true, data: [] })
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, department: { select: { name: true } } } },
        creator: { select: { name: true } },
        _count: { select: { results: true, questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: assessments })
  } catch (error) {
    console.error('My assessments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// GET /assessments/detail/:assessmentId — full detail with questions + results
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

// GET /assessments/subjects — subjects available for creating assessments (per role)
export async function getAssessableSubjects(req, res) {
  try {
    const role = req.user.role
    let where = {}

    if (role === 'teacher') {
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: req.user.id, isActive: true },
        select: { subjectId: true },
      })
      where.id = { in: assignments.map(a => a.subjectId) }
    } else if (role === 'hod') {
      const deptId = req.user.departmentId
      if (deptId) where.departmentId = deptId
      else return res.json({ success: true, data: [] })
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
    })

    res.json({ success: true, data: subjects })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}

// GET /assessments/pending — student's assessments not yet taken
export async function getStudentPendingAssessments(req, res) {
  try {
    const studentId = req.user.id
    const deptId = req.user.departmentId
    const gradeId = req.user.gradeId

    let subjectWhere = {}
    if (deptId) subjectWhere.departmentId = deptId
    else if (gradeId) subjectWhere.gradeId = gradeId
    else return res.json({ success: true, data: { pending: [], completed: [] } })

    // All assessments for student's subjects
    const allAssessments = await prisma.assessment.findMany({
      where: { subject: subjectWhere },
      include: {
        subject: { select: { name: true } },
        creator: { select: { name: true } },
        _count: { select: { questions: true } },
        results: { where: { studentId }, select: { id: true, score: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const pending = []
    const completed = []

    allAssessments.forEach(a => {
      const base = {
        id: a.id, title: a.title, type: a.type, dueDate: a.dueDate,
        subjectName: a.subject.name, creatorName: a.creator.name,
        questionsCount: a._count.questions, createdAt: a.createdAt,
      }
      if (a.results.length > 0) {
        completed.push({ ...base, score: a.results[0].score, submittedAt: a.results[0].submittedAt })
      } else {
        pending.push(base)
      }
    })

    res.json({ success: true, data: { pending, completed } })
  } catch (error) {
    console.error('Student pending error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

// GET /assessments/take/:assessmentId — get assessment questions for student to answer
export async function getAssessmentForStudent(req, res) {
  try {
    const { assessmentId } = req.params
    const studentId = req.user.id

    // Check if already submitted
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
          select: {
            id: true, question: true, options: true,
            // Don't send answer to student!
          },
        },
      },
    })
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' })

    res.json({ success: true, data: assessment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessment' })
  }
}

export async function submitAssessment(req, res) {
  try {
    const { assessmentId, answers } = req.body
    const studentId = req.user.id

    // Fetch correct answers
    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
    })
    if (questions.length === 0) {
      return res.status(400).json({ success: false, error: 'No questions in this assessment' })
    }

    // Auto-grade MCQ
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

export async function getAssessmentsBySubject(req, res) {
  try {
    const { subjectId } = req.params
    const assessments = await prisma.assessment.findMany({
      where: { subjectId },
      include: { _count: { select: { results: true } }, questions: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: assessments })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' })
  }
}

export async function getStudentResults(req, res) {
  try {
    const { studentId } = req.params
    const results = await prisma.assessmentResult.findMany({
      where: { studentId },
      include: { assessment: { include: { subject: { select: { name: true } } } } },
      orderBy: { submittedAt: 'desc' },
    })
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch results' })
  }
}

export async function getAssessmentReport(req, res) {
  try {
    const { assessmentId } = req.params
    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { score: 'desc' },
    })
    const avg = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0
    res.json({ success: true, data: { results, average: avg.toFixed(1), total: results.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
}
