import prisma from '../../config/prisma.js'
import { invalidateUserCache } from '../../middleware/auth.middleware.js'
import { invalidateCache } from './stats.js'

// ─── Admin Management ──────────────────────────────────────────────────────────

export async function getAdmins(req, res) {
  try {
    const { cursor, limit: rawLimit, search } = req.query
    const limit = Math.min(parseInt(rawLimit) || 20, 100)

    const where = { role: 'admin' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const query = {
      where,
      select: {
        id: true, name: true, email: true, createdAt: true,
        adminAssignments: {
          include: { institution: { select: { id: true, name: true, type: true } } },
        },
      },
      orderBy: { createdAt: 'desc' }, take: limit + 1,
    }
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1 }

    const [items, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where }),
    ])
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    const result = items.map(admin => ({
      id: admin.id, name: admin.name, email: admin.email,
      createdAt: admin.createdAt, assignments: admin.adminAssignments,
    }))

    res.json({
      success: true, data: result,
      pagination: { total, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch admins' })
  }
}

export async function createAdmin(req, res) {
  try {
    const { name, email } = req.body
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' })
    }

    const admin = await prisma.user.create({
      data: { name, email, role: 'admin', isApproved: true }
    })

    invalidateCache('stats')
    res.status(201).json({ success: true, data: { id: admin.id, name: admin.name, email: admin.email } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create admin' })
  }
}

export async function deleteAdmin(req, res) {
  try {
    const { id } = req.params
    await prisma.adminInstitutionAssignment.deleteMany({ where: { adminId: id } })
    await prisma.user.delete({ where: { id } })
    invalidateCache('stats')
    invalidateUserCache(id)
    res.json({ success: true, data: { message: 'Admin deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete admin' })
  }
}

export async function assignInstitution(req, res) {
  try {
    const { adminId, institutionId, isActive } = req.body

    const assignment = await prisma.adminInstitutionAssignment.upsert({
      where: { adminId_institutionId: { adminId, institutionId } },
      update: { isActive },
      create: { adminId, institutionId, isActive },
    })

    res.json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign institution' })
  }
}
