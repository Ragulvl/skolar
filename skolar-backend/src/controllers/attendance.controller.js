import prisma from '../config/prisma.js'

export async function markAttendance(req, res) {
  try {
    const { records, subjectId, date } = req.body
    const teacherId = req.user.id

    const data = records.map(r => ({
      studentId: r.studentId,
      subjectId,
      teacherId,
      date: new Date(date),
      status: r.status,
    }))

    const result = await prisma.attendance.createMany({ data })
    res.status(201).json({ success: true, data: { count: result.count } })
  } catch (error) {
    console.error('Mark attendance error:', error)
    res.status(500).json({ success: false, error: 'Failed to mark attendance' })
  }
}

export async function getStudentAttendance(req, res) {
  try {
    const { studentId } = req.params
    const records = await prisma.attendance.findMany({
      where: { studentId },
      include: { subject: { select: { name: true } } },
      orderBy: { date: 'desc' },
    })
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' })
  }
}

export async function getClassAttendance(req, res) {
  try {
    const { sectionId, subjectId } = req.params
    const [students, records] = await Promise.all([
      prisma.user.findMany({
        where: { sectionId, role: 'student' },
        select: { id: true, name: true },
      }),
      prisma.attendance.findMany({
        where: {
          subjectId,
          student: { sectionId },
        },
        orderBy: { date: 'desc' },
      }),
    ])

    res.json({ success: true, data: { students, records } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch class attendance' })
  }
}

export async function getAttendanceReport(req, res) {
  try {
    const { institutionId } = req.params

    // Single groupBy instead of 3 separate count() calls
    const statusCounts = await prisma.attendance.groupBy({
      by: ['status'],
      where: { student: { institutionId } },
      _count: true,
    })

    const countMap = {}
    statusCounts.forEach(s => { countMap[s.status] = s._count })

    const total = Object.values(countMap).reduce((a, b) => a + b, 0)
    const present = countMap.present || 0
    const absent = countMap.absent || 0

    res.json({
      success: true,
      data: {
        total, present, absent,
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
}
