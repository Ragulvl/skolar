import prisma from '../config/prisma.js'

export async function getDepartments(req, res) {
  try {
    const { institutionId } = req.params
    const departments = await prisma.department.findMany({
      where: { institutionId },
      include: { _count: { select: { users: true, subjects: true } } },
    })
    res.json({ success: true, data: departments })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' })
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, institutionId } = req.body
    const dept = await prisma.department.create({ data: { name, institutionId } })
    res.status(201).json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create department' })
  }
}

export async function assignHOD(req, res) {
  try {
    const { departmentId, hodId } = req.body
    const dept = await prisma.department.update({
      where: { id: departmentId },
      data: { hodId },
    })
    res.json({ success: true, data: dept })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign HOD' })
  }
}

export async function assignTeacher(req, res) {
  try {
    const { teacherId, departmentId } = req.body
    const assignment = await prisma.teacherDeptAssignment.create({
      data: { teacherId, departmentId },
    })
    res.status(201).json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign teacher' })
  }
}

export async function getStudents(req, res) {
  try {
    const { deptId } = req.params
    const students = await prisma.user.findMany({
      where: { departmentId: deptId, role: 'student' },
      select: { id: true, name: true, email: true, departmentId: true },
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}
