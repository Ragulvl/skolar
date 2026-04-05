import prisma from '../config/prisma.js'

export async function createAssessment(req, res) {
  try {
    const { title, type, subjectId, dueDate, questions } = req.body
    // institutionId removed — derivable from subject.institutionId or creator.institutionId
    const assessment = await prisma.assessment.create({
      data: {
        title, type, subjectId, dueDate: new Date(dueDate),
        createdBy: req.user.id,
        questions: questions ? { create: questions } : undefined,
      },
      include: { questions: true },
    })
    res.status(201).json({ success: true, data: assessment })
  } catch (error) {
    console.error('Create assessment error:', error)
    res.status(500).json({ success: false, error: 'Failed to create assessment' })
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

export async function submitAssessment(req, res) {
  try {
    const { assessmentId, score, answers } = req.body
    const result = await prisma.assessmentResult.create({
      data: { assessmentId, studentId: req.user.id, score, answers },
    })
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Already submitted' })
    }
    res.status(500).json({ success: false, error: 'Failed to submit assessment' })
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
