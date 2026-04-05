import prisma from '../config/prisma.js'

// ──────────────────────────────────────────────
// GET /teacher/dashboard — Scoped view per dept
// ──────────────────────────────────────────────
export async function getTeacherDashboard(req, res) {
  try {
    const teacherId = req.user.id
    const ownDeptId = req.user.departmentId

    // Get all active subject assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      include: {
        subject: {
          select: {
            id: true, name: true, departmentId: true,
            department: { select: { id: true, name: true } },
            _count: { select: { assessments: true, attendances: true } },
          },
        },
      },
    })

    // Separate own-dept vs cross-dept
    const ownDeptSubjects = []
    const crossDeptSubjects = []

    assignments.forEach(a => {
      const entry = {
        assignmentId: a.id,
        subjectId: a.subject.id,
        subjectName: a.subject.name,
        departmentId: a.subject.departmentId,
        departmentName: a.subject.department?.name || 'Unknown',
        assessments: a.subject._count.assessments,
        attendanceRecords: a.subject._count.attendances,
        isOwnDept: a.subject.departmentId === ownDeptId,
      }
      if (entry.isOwnDept) {
        ownDeptSubjects.push(entry)
      } else {
        crossDeptSubjects.push(entry)
      }
    })

    // Stats
    const allSubjectIds = assignments.map(a => a.subject.id)
    const [attendanceCount, assessmentCount, studentCount] = await Promise.all([
      prisma.attendance.count({ where: { teacherId } }),
      prisma.assessment.count({ where: { createdBy: teacherId } }),
      ownDeptId
        ? prisma.user.count({ where: { departmentId: ownDeptId, role: 'student' } })
        : Promise.resolve(0),
    ])

    res.json({
      success: true,
      data: {
        stats: {
          totalSubjects: assignments.length,
          ownDeptSubjects: ownDeptSubjects.length,
          crossDeptSubjects: crossDeptSubjects.length,
          attendanceMarked: attendanceCount,
          assessmentsCreated: assessmentCount,
          deptStudents: studentCount,
        },
        ownDeptSubjects,
        crossDeptSubjects,
        ownDeptId,
      },
    })
  } catch (error) {
    console.error('Teacher dashboard error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' })
  }
}

// ──────────────────────────────────────────────
// GET /teacher/my-classes — All subject assignments with scope info
// ──────────────────────────────────────────────
export async function getTeacherClasses(req, res) {
  try {
    const teacherId = req.user.id
    const ownDeptId = req.user.departmentId

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      include: {
        subject: {
          select: {
            id: true, name: true, departmentId: true,
            department: { select: { id: true, name: true } },
            _count: { select: { attendances: true, assessments: true } },
          },
        },
      },
    })

    const classes = assignments.map(a => ({
      assignmentId: a.id,
      subjectId: a.subject.id,
      subjectName: a.subject.name,
      departmentId: a.subject.departmentId,
      departmentName: a.subject.department?.name || 'Unknown',
      isOwnDept: a.subject.departmentId === ownDeptId,
      attendanceRecords: a.subject._count.attendances,
      assessments: a.subject._count.assessments,
    }))

    res.json({ success: true, data: classes })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' })
  }
}

// ──────────────────────────────────────────────
// GET /teacher/dept-view — Full dept view (OWN DEPT ONLY)
// ──────────────────────────────────────────────
export async function getTeacherDeptView(req, res) {
  try {
    const ownDeptId = req.user.departmentId
    if (!ownDeptId) {
      return res.status(400).json({ success: false, error: 'No primary department assigned' })
    }

    // Full dept data — students, subjects, teachers, attendance
    const [dept, students, teachers, subjects, attendanceStats] = await Promise.all([
      prisma.department.findUnique({
        where: { id: ownDeptId },
        select: { id: true, name: true, hodId: true, deanId: true },
      }),
      prisma.user.findMany({
        where: { departmentId: ownDeptId, role: 'student' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { departmentId: ownDeptId, role: 'teacher' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.subject.findMany({
        where: { departmentId: ownDeptId },
        include: {
          teacherAssignments: {
            where: { isActive: true },
            include: { teacher: { select: { name: true } } },
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { departmentId: ownDeptId } },
        _count: true,
      }),
    ])

    const attMap = {}
    attendanceStats.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        department: dept,
        students,
        teachers,
        subjects: subjects.map(s => ({
          id: s.id, name: s.name,
          assignedTeachers: s.teacherAssignments.map(ta => ta.teacher.name),
        })),
        attendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, late: attMap.late || 0,
          total: attTotal,
          percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
        },
      },
    })
  } catch (error) {
    console.error('Teacher dept view error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch dept view' })
  }
}

// ──────────────────────────────────────────────
// GET /teacher/subject/:subjectId — Subject-scoped view (CROSS-DEPT)
// Middleware isTeacherOfSubject() enforced in routes
// ──────────────────────────────────────────────
export async function getTeacherSubjectView(req, res) {
  try {
    const { subjectId } = req.params
    const teacherId = req.user.id

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { assessments: true, attendances: true } },
      },
    })
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' })

    // Only teacher's own attendance records for this subject
    const [myAttendance, myAssessments, studentsInDept] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['status'],
        where: { subjectId, teacherId },
        _count: true,
      }),
      prisma.assessment.findMany({
        where: { subjectId, createdBy: teacherId },
        include: { _count: { select: { results: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      subject.departmentId
        ? prisma.user.findMany({
            where: { departmentId: subject.departmentId, role: 'student' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ])

    const attMap = {}
    myAttendance.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name,
          departmentId: subject.departmentId,
          departmentName: subject.department?.name,
        },
        students: studentsInDept, // Students in that dept (for marking attendance)
        myAttendance: {
          present: attMap.present || 0, absent: attMap.absent || 0, late: attMap.late || 0,
          total: attTotal,
        },
        myAssessments: myAssessments.map(a => ({
          id: a.id, title: a.title, type: a.type, dueDate: a.dueDate,
          resultsCount: a._count.results,
        })),
      },
    })
  } catch (error) {
    console.error('Teacher subject view error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch subject view' })
  }
}

// ──────────────────────────────────────────────
// GET /teacher/my-students — Students for teacher's subjects
// ──────────────────────────────────────────────
export async function getTeacherStudents(req, res) {
  try {
    const teacherId = req.user.id
    const ownDeptId = req.user.departmentId

    // Get all dept IDs this teacher teaches in
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      select: { subject: { select: { departmentId: true } } },
    })
    const deptIds = [...new Set(assignments.map(a => a.subject.departmentId).filter(Boolean))]

    if (deptIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

    const students = await prisma.user.findMany({
      where: { departmentId: { in: deptIds }, role: 'student' },
      select: {
        id: true, name: true, email: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Mark which students are in own dept
    const result = students.map(s => ({
      ...s,
      isOwnDept: s.department?.id === ownDeptId,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}
