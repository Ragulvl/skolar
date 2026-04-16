import prisma from '../../config/prisma.js'
import { getPermissionFlags } from '../../middleware/access.middleware.js'

// ═══════════════════════════════════════════════
// GET /college-admin/departments
// ═══════════════════════════════════════════════

export async function getDepartments(req, res) {
  try {
    const instId = req.user.institutionId
    const departments = await prisma.department.findMany({
      where: { institutionId: instId },
      include: { _count: { select: { users: true, subjects: true } } },
    })

    const hodDeanIds = [...new Set([
      ...departments.map(d => d.hodId), ...departments.map(d => d.deanId),
    ].filter(Boolean))]
    const users = hodDeanIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: hodDeanIds } }, select: { id: true, name: true, email: true }, take: 50,
    }) : []
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u })

    const result = departments.map(d => ({
      id: d.id, name: d.name,
      hodId: d.hodId, hod: d.hodId ? userMap[d.hodId] || null : null,
      deanId: d.deanId, dean: d.deanId ? userMap[d.deanId] || null : null,
      teacherCount: d._count.users, subjectCount: d._count.subjects,
    }))

    res.json({ success: true, data: result, permissions: getPermissionFlags(req.user.role) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

// ═══════════════════════════════════════════════
// GET /college-admin/departments/:deptId — Drill-down
// ═══════════════════════════════════════════════

export async function getDepartmentDetail(req, res) {
  try {
    const instId = req.user.institutionId
    const { deptId } = req.params

    const dept = await prisma.department.findUnique({
      where: { id: deptId },
      include: { _count: { select: { users: true, subjects: true } } },
    })
    if (!dept || dept.institutionId !== instId) {
      return res.status(404).json({ success: false, error: 'Department not found' })
    }

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const [teachers, students, subjects, todayAtt, hod, dean] = await Promise.all([
      prisma.user.findMany({
        where: { departmentId: deptId, role: 'teacher' },
        select: {
          id: true, name: true, email: true, avatarUrl: true,
          teacherAssignments: { where: { isActive: true }, include: { subject: { select: { name: true } } } },
        },
        orderBy: { name: 'asc' }, take: 20,
      }),
      prisma.user.findMany({
        where: { departmentId: deptId, role: 'student' },
        select: { id: true, name: true, email: true, avatarUrl: true },
        orderBy: { name: 'asc' }, take: 20,
      }),
      prisma.subject.findMany({
        where: { departmentId: deptId },
        include: {
          teacherAssignments: { where: { isActive: true }, include: { teacher: { select: { id: true, name: true } } } },
          _count: { select: { assessments: true, attendances: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { student: { departmentId: deptId }, date: { gte: today, lt: tomorrow } },
        _count: true,
      }),
      dept.hodId ? prisma.user.findUnique({ where: { id: dept.hodId }, select: { id: true, name: true, email: true, avatarUrl: true } }) : null,
      dept.deanId ? prisma.user.findUnique({ where: { id: dept.deanId }, select: { id: true, name: true, email: true, avatarUrl: true } }) : null,
    ])

    const attMap = {}
    todayAtt.forEach(a => { attMap[a.status] = a._count })
    const attTotal = Object.values(attMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        id: dept.id, name: dept.name, hod, dean,
        stats: {
          teachers: teachers.length, students: students.length, subjects: subjects.length,
          todayAttendance: {
            present: attMap.present || 0, absent: attMap.absent || 0, total: attTotal,
            percentage: attTotal > 0 ? ((attMap.present || 0) / attTotal * 100).toFixed(1) : '0',
          },
        },
        teachers, students, subjects,
      },
      permissions: getPermissionFlags(req.user.role),
    })
  } catch (error) {
    console.error('Department detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch department details' })
  }
}

// ═══════════════════════════════════════════════
// CRUD — Departments
// ═══════════════════════════════════════════════

export async function createDepartment(req, res) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Department name required' })
    const dept = await prisma.department.create({ data: { name, institutionId: req.user.institutionId } })
    res.status(201).json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create department' })
  }
}

export async function deleteDepartment(req, res) {
  try {
    const { deptId } = req.params
    const dept = await prisma.department.findUnique({ where: { id: deptId } })
    if (!dept || dept.institutionId !== req.user.institutionId) {
      return res.status(404).json({ success: false, error: 'Department not found' })
    }
    await prisma.department.delete({ where: { id: deptId } })
    res.json({ success: true, data: { message: 'Department deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete department' })
  }
}

export async function assignDean(req, res) {
  try {
    const { departmentId, deanId } = req.body
    if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId required' })
    const dept = await prisma.department.update({ where: { id: departmentId }, data: { deanId: deanId || null } })
    res.json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign dean' })
  }
}

export async function assignHOD(req, res) {
  try {
    const { departmentId, hodId } = req.body
    if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId required' })
    const dept = await prisma.department.update({ where: { id: departmentId }, data: { hodId: hodId || null } })
    res.json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign HOD' })
  }
}
