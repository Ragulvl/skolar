import prisma from '../../config/prisma.js'

// ─── Response Cache ─────────────────────────────────────────────────────────────
const responseCache = new Map()

export function getCached(key, ttlMs = 30_000) {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) {
    responseCache.delete(key)
    return null
  }
  return entry.data
}

export function setCache(key, data) {
  responseCache.set(key, { data, ts: Date.now() })
}

export function invalidateCache(prefix) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) responseCache.delete(key)
  }
}

// ─── Platform Stats ─────────────────────────────────────────────────────────────

export async function getPlatformStats(req, res) {
  try {
    const cached = getCached('stats')
    if (cached) return res.json({ success: true, data: cached })

    const [instCounts, roleCounts, assessments, attendance] = await Promise.all([
      prisma.institution.groupBy({ by: ['type'], _count: true }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.assessment.count(),
      prisma.attendance.count(),
    ])

    const roleMap = {}
    roleCounts.forEach(r => { roleMap[r.role] = r._count })

    const instMap = {}
    instCounts.forEach(i => { instMap[i.type] = i._count })

    const data = {
      total: (instMap.school || 0) + (instMap.college || 0),
      schools: instMap.school || 0,
      colleges: instMap.college || 0,
      users: Object.values(roleMap).reduce((a, b) => a + b, 0),
      pending: roleMap.pending || 0,
      teachers: roleMap.teacher || 0,
      students: roleMap.student || 0,
      admins: roleMap.admin || 0,
      assessments,
      attendance,
    }

    setCache('stats', data)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

// ─── Platform Activity Feed ────────────────────────────────────────────────────

export async function getPlatformActivity(req, res) {
  try {
    const cached = getCached('activity')
    if (cached) return res.json({ success: true, data: cached })

    const [recentSignups, recentInstitutions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true, name: true, email: true, role: true, isApproved: true,
          createdAt: true, institution: { select: { name: true, type: true } },
        },
      }),
      prisma.institution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, type: true, code: true, createdAt: true },
      }),
    ])

    const activity = [
      ...recentSignups.map(u => ({
        type: u.role === 'pending' ? 'user_signup' : 'user_approved',
        message: u.role === 'pending'
          ? `${u.name} signed up at ${u.institution?.name || 'Unknown'}`
          : `${u.name} was approved as ${u.role.replace(/_/g, ' ')}`,
        timestamp: u.createdAt,
        meta: { userId: u.id, role: u.role, institution: u.institution?.name },
      })),
      ...recentInstitutions.map(i => ({
        type: 'institution_created',
        message: `${i.name} (${i.type}) was created`,
        timestamp: i.createdAt,
        meta: { institutionId: i.id, code: i.code },
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15)

    setCache('activity', activity)
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activity' })
  }
}

// ─── Enhanced Analytics ────────────────────────────────────────────────────────

export async function getEnhancedAnalytics(req, res) {
  try {
    const cached = getCached('analytics', 60_000)
    if (cached) return res.json({ success: true, data: cached })

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
      roleDistribution, institutionUsers, attendanceStats,
      totalAssessments, totalResults, avgScore,
      institutionCities, monthlySignupData,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.institution.findMany({
        select: { id: true, name: true, type: true, _count: { select: { users: true } } },
        orderBy: { users: { _count: 'desc' } },
        take: 10,
      }),
      prisma.attendance.groupBy({ by: ['status'], _count: true }),
      prisma.assessment.count(),
      prisma.assessmentResult.count(),
      prisma.assessmentResult.aggregate({ _avg: { score: true } }),
      prisma.institution.groupBy({
        by: ['city'], _count: true,
        orderBy: { _count: { city: 'desc' } }, take: 10,
      }),
      prisma.$queryRaw`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY month
      `,
    ])

    const data = {
      roleDistribution: roleDistribution.map(r => ({ role: r.role, count: r._count })),
      institutionUsers: institutionUsers.map(i => ({ name: i.name, type: i.type, users: i._count.users })),
      attendanceStats: attendanceStats.reduce((acc, a) => { acc[a.status] = a._count; return acc }, {}),
      assessmentStats: { total: totalAssessments, results: totalResults, avgScore: avgScore._avg.score },
      regionData: institutionCities.map(i => ({ city: i.city || 'Unknown', count: i._count })),
      monthlySignups: monthlySignupData,
    }

    setCache('analytics', data)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Enhanced analytics error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' })
  }
}

// ─── Platform Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  platform_name: 'Skolar',
  allow_signups: 'true',
  maintenance_mode: 'false',
  max_institutions_per_admin: '10',
  default_pending_timeout_days: '30',
}

export async function getPlatformSettings(req, res) {
  try {
    const settings = await prisma.platformSetting.findMany()
    const settingsMap = { ...DEFAULT_SETTINGS }
    settings.forEach(s => { settingsMap[s.key] = s.value })
    res.json({ success: true, data: settingsMap })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' })
  }
}

export async function updatePlatformSettings(req, res) {
  try {
    const updates = req.body
    const validKeys = Object.keys(DEFAULT_SETTINGS)
    const results = []

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue
      const setting = await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
      results.push(setting)
    }

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' })
  }
}
