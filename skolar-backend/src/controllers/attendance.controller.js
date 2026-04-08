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
      data: { total, present, absent, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0 },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
}

// GET /attendance/my-assignments — Teacher's own subject assignments
export async function getMyAssignments(req, res) {
  try {
    const teacherId = req.user.id

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      include: {
        subject: {
          select: {
            id: true, name: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    })

    // Also get students in the department(s) for marking attendance
    const deptIds = [...new Set(assignments.map(a => a.subject.department?.id).filter(Boolean))]

    const students = deptIds.length > 0 ? await prisma.user.findMany({
      where: { departmentId: { in: deptIds }, role: 'student' },
      select: { id: true, name: true, email: true, departmentId: true },
      orderBy: { name: 'asc' },
    }) : []

    res.json({
      success: true,
      data: {
        assignments: assignments.map(a => ({
          id: a.id,
          subjectId: a.subject.id,
          subjectName: a.subject.name,
          departmentId: a.subject.department?.id,
          departmentName: a.subject.department?.name,
        })),
        students,
      },
    })
  } catch (error) {
    console.error('My assignments error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' })
  }
}

// GET /attendance/markable-students/:subjectId?date=YYYY-MM-DD
export async function getMarkableStudents(req, res) {
  try {
    const { subjectId } = req.params
    const date = req.query.date || new Date().toISOString().split('T')[0]

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { departmentId: true, gradeId: true, name: true },
    })
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' })

    // Get students in the subject's department (college) or grade (school)
    const where = { role: 'student' }
    if (subject.departmentId) where.departmentId = subject.departmentId
    else if (subject.gradeId) where.gradeId = subject.gradeId
    else return res.json({ success: true, data: { students: [], existing: [] } })

    const [students, existing] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      // Check if attendance already marked for this date+subject
      prisma.attendance.findMany({
        where: {
          subjectId,
          date: new Date(date + 'T00:00:00.000Z'),
        },
        select: { studentId: true, status: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        subjectName: subject.name,
        students,
        existing: existing.map(e => ({ studentId: e.studentId, status: e.status })),
        date,
      },
    })
  } catch (error) {
    console.error('Markable students error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}
