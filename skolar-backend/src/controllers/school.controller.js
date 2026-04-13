import prisma from '../config/prisma.js'

// GET /school/teachers-by-institution/:institutionId — cursor-paginated
export async function getTeachersByInstitution(req, res) {
  try {
    const { institutionId } = req.params
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { institutionId, role: 'teacher' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      orderBy: { name: 'asc' },
      take: limit + 1,
      select: {
        id: true, name: true, email: true,
        teacherAssignments: {
          include: {
            subject: { select: { name: true } },
            section: { select: { name: true, grade: { select: { name: true } } } },
          }
        }
      },
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    // Flatten for table display
    const data = items.map(t => ({
      id: t.id, name: t.name, email: t.email,
      subject: t.teacherAssignments[0]?.subject?.name || '—',
      grade: t.teacherAssignments[0]?.section?.grade?.name || '—',
      section: t.teacherAssignments[0]?.section?.name || '—',
    }))

    res.json({
      success: true,
      data,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('getTeachersByInstitution error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch teachers' })
  }
}

// GET /school/students-by-institution/:institutionId — cursor-paginated
export async function getStudentsByInstitution(req, res) {
  try {
    const { institutionId } = req.params
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { institutionId, role: 'student' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      orderBy: { name: 'asc' },
      take: limit + 1,
      select: {
        id: true, name: true, email: true,
        grade: { select: { name: true } },
        section: { select: { name: true } },
      },
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where }),
    ])

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    const data = items.map(s => ({
      id: s.id, name: s.name, email: s.email,
      grade: s.grade?.name || '—',
      section: s.section?.name || '—',
    }))

    res.json({
      success: true,
      data,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    console.error('getStudentsByInstitution error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}

// Returns all 15 master grades with sections filtered by institutionId
export async function getGrades(req, res) {
  try {
    const { institutionId } = req.params
    const grades = await prisma.grade.findMany({
      include: {
        sections: {
          where: { institutionId },
          include: { _count: { select: { users: true } } },
        }
      },
      orderBy: { name: 'asc' },
    })
    // Only return grades that have sections in this institution
    const filtered = grades.filter(g => g.sections.length > 0)
    res.json({ success: true, data: filtered })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch grades' })
  }
}

export async function getSections(req, res) {
  try {
    const { gradeId } = req.params
    const { institutionId } = req.query
    const where = { gradeId }
    if (institutionId) where.institutionId = institutionId

    const sections = await prisma.section.findMany({
      where,
      include: { _count: { select: { users: true } } },
    })
    res.json({ success: true, data: sections })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sections' })
  }
}

export async function createSection(req, res) {
  try {
    const { name, gradeId, institutionId } = req.body
    const section = await prisma.section.create({
      data: { name, gradeId, institutionId }
    })
    res.status(201).json({ success: true, data: section })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create section' })
  }
}

export async function getSubjects(req, res) {
  try {
    const { gradeId } = req.params
    const subjects = await prisma.subject.findMany({ where: { gradeId } })
    res.json({ success: true, data: subjects })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' })
  }
}

export async function createSubject(req, res) {
  try {
    const { name, gradeId, institutionId } = req.body
    const subject = await prisma.subject.create({
      data: { name, gradeId, institutionId: institutionId || undefined }
    })
    res.status(201).json({ success: true, data: subject })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create subject' })
  }
}

export async function assignTeacher(req, res) {
  try {
    const { teacherId, subjectId, sectionId } = req.body
    // gradeId removed — derive from section.gradeId
    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, subjectId, sectionId }
    })
    res.status(201).json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign teacher' })
  }
}

export async function reassignTeacher(req, res) {
  try {
    const { assignmentId, subjectId, sectionId } = req.body
    // gradeId removed — derive from section.gradeId
    const assignment = await prisma.teacherAssignment.update({
      where: { id: assignmentId },
      data: { subjectId, sectionId },
    })
    res.json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reassign teacher' })
  }
}

export async function getStudents(req, res) {
  try {
    const { sectionId } = req.params
    const students = await prisma.user.findMany({
      where: { sectionId, role: 'student' },
      select: { id: true, name: true, email: true, gradeId: true, sectionId: true },
      take: 200,
    })
    res.json({ success: true, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
}
