import prisma from '../../config/prisma.js'
import { generateInstitutionCode } from '../../utils/codeGenerator.utils.js'
import { invalidateCache } from './stats.js'

// ─── Institutions ──────────────────────────────────────────────────────────────

export async function getInstitutions(req, res) {
  try {
    const { type, cursor, limit: rawLimit, search } = req.query
    const where = {}
    if (type === 'school' || type === 'college') where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const query = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true, name: true, code: true, city: true, type: true,
        isActive: true, createdAt: true,
        _count: { select: { users: true } },
      },
    }

    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.institution.findMany(query),
      prisma.institution.count({ where }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    res.json({
      success: true, data: items,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch institutions' })
  }
}

export async function createInstitution(req, res) {
  try {
    const { name, type, city } = req.body
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' })
    }

    const count = await prisma.institution.count({ where: { type } })
    const code = generateInstitutionCode(type, count)

    const institution = await prisma.institution.create({ data: { name, type, code, city } })

    invalidateCache('stats')
    res.status(201).json({ success: true, data: institution })
  } catch (error) {
    console.error('Create institution error:', error)
    res.status(500).json({ success: false, error: 'Failed to create institution' })
  }
}

export async function updateInstitution(req, res) {
  try {
    const { id } = req.params
    const institution = await prisma.institution.update({ where: { id }, data: req.body })
    res.json({ success: true, data: institution })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update institution' })
  }
}

export async function deleteInstitution(req, res) {
  try {
    const { id } = req.params

    await prisma.adminInstitutionAssignment.deleteMany({ where: { institutionId: id } })
    const sections = await prisma.section.findMany({ where: { institutionId: id }, select: { id: true } })
    const sectionIds = sections.map(s => s.id)
    if (sectionIds.length > 0) {
      await prisma.teacherAssignment.deleteMany({ where: { sectionId: { in: sectionIds } } })
    }
    await prisma.section.deleteMany({ where: { institutionId: id } })
    await prisma.subject.deleteMany({ where: { institutionId: id } })
    await prisma.teacherDeptAssignment.deleteMany({ where: { department: { institutionId: id } } })
    await prisma.department.deleteMany({ where: { institutionId: id } })

    let userCursor = undefined
    const BATCH = 500
    while (true) {
      const batch = await prisma.user.findMany({
        where: { institutionId: id }, select: { id: true },
        take: BATCH,
        ...(userCursor ? { cursor: { id: userCursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
      })
      if (batch.length === 0) break
      const batchIds = batch.map(u => u.id)
      userCursor = batch[batch.length - 1].id

      await prisma.attendance.deleteMany({ where: { OR: [{ studentId: { in: batchIds } }, { teacherId: { in: batchIds } }] } })
      await prisma.assessmentResult.deleteMany({ where: { studentId: { in: batchIds } } })

      const assessments = await prisma.assessment.findMany({ where: { createdBy: { in: batchIds } }, select: { id: true }, take: 5000 })
      const assessmentIds = assessments.map(a => a.id)
      if (assessmentIds.length > 0) {
        await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
        await prisma.assessmentResult.deleteMany({ where: { assessmentId: { in: assessmentIds } } })
        await prisma.assessment.deleteMany({ where: { id: { in: assessmentIds } } })
      }
      await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: batchIds } } })
      await prisma.teacherDeptAssignment.deleteMany({ where: { teacherId: { in: batchIds } } })
    }
    await prisma.user.deleteMany({ where: { institutionId: id } })
    await prisma.institution.delete({ where: { id } })

    invalidateCache('stats')
    invalidateCache('analytics')
    res.json({ success: true, data: { message: 'Institution and all related data deleted' } })
  } catch (error) {
    console.error('Delete institution error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete institution' })
  }
}

export async function getInstitutionDetail(req, res) {
  try {
    const { id } = req.params

    const [institution, roleCounts, grades, subjects, departments, recentUsers] = await Promise.all([
      prisma.institution.findUnique({
        where: { id },
        include: { _count: { select: { users: true, sections: true, subjects: true, departments: true } } },
      }),
      prisma.user.groupBy({ by: ['role'], where: { institutionId: id }, _count: true }),
      prisma.grade.findMany({
        include: {
          sections: { where: { institutionId: id }, include: { _count: { select: { users: true } } } },
        },
        orderBy: { name: 'asc' }, take: 50,
      }),
      prisma.subject.findMany({
        where: { institutionId: id },
        include: { grade: { select: { name: true } }, department: { select: { name: true } } },
        orderBy: { name: 'asc' }, take: 100,
      }),
      prisma.department.findMany({
        where: { institutionId: id },
        include: { _count: { select: { users: true, subjects: true } } },
      }),
      prisma.user.findMany({
        where: { institutionId: id },
        select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 10,
      }),
    ])

    if (!institution) {
      return res.status(404).json({ success: false, error: 'Institution not found' })
    }

    const activeGrades = grades.filter(g => g.sections.length > 0)

    res.json({
      success: true,
      data: {
        ...institution,
        roleCounts: roleCounts.reduce((acc, r) => { acc[r.role] = r._count; return acc }, {}),
        grades: activeGrades, subjects, departments, recentUsers,
      },
    })
  } catch (error) {
    console.error('Institution detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch institution details' })
  }
}
