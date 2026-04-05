import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const DEFAULT_PASSWORD = 'admin@123'
const BCRYPT_ROUNDS = 12

async function main() {
  console.log('🌱 Seeding role-based users for KIT (college) and BB (school)...\n')

  // Hash the default password once
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS)
  console.log(`🔒 Password hash generated for "${DEFAULT_PASSWORD}"`)

  // ──────────────────────────────────────────────
  // Find the two target institutions
  // ──────────────────────────────────────────────
  const kit = await prisma.institution.findFirst({
    where: { name: { contains: 'Kalaignar Karunanidhi', mode: 'insensitive' } },
  })
  const bb = await prisma.institution.findFirst({
    where: { name: { contains: 'Blue Bird', mode: 'insensitive' } },
  })

  if (!kit) {
    console.error('❌ College "Kalaignar Karunanidhi Institute of Technology" not found in DB!')
    console.log('   Run `npm run seed` first to create institutions.')
    process.exit(1)
  }
  if (!bb) {
    console.error('❌ School "Blue Bird Matric Higher Secondary School" not found in DB!')
    console.log('   Run `npm run seed` first to create institutions.')
    process.exit(1)
  }

  console.log(`\n📍 College: ${kit.name} (code: ${kit.code}, id: ${kit.id})`)
  console.log(`📍 School:  ${bb.name} (code: ${bb.code}, id: ${bb.id})`)

  // ──────────────────────────────────────────────
  // Get a department from KIT for dept-scoped roles
  // ──────────────────────────────────────────────
  const kitDepts = await prisma.department.findMany({
    where: { institutionId: kit.id },
    orderBy: { name: 'asc' },
  })

  if (kitDepts.length === 0) {
    console.error('❌ No departments found for KIT! Run `npm run seed` first.')
    process.exit(1)
  }

  const cseDept = kitDepts.find(d => d.name.includes('Computer Science')) || kitDepts[0]
  const itDept = kitDepts.find(d => d.name.includes('Information Technology')) || kitDepts[1] || kitDepts[0]

  console.log(`📚 College dept (for HOD/Dean): ${cseDept.name}`)

  // ──────────────────────────────────────────────
  // Get a grade + section from BB school
  // ──────────────────────────────────────────────
  const bbSection = await prisma.section.findFirst({
    where: { institutionId: bb.id },
    include: { grade: true },
  })

  const bbGradeId = bbSection?.gradeId || null
  const bbSectionId = bbSection?.id || null

  if (bbSection) {
    console.log(`🏫 School grade/section: Grade ${bbSection.grade.name} - Section ${bbSection.name}`)
  }

  // ──────────────────────────────────────────────
  // Helper to create a user (upsert by email)
  // ──────────────────────────────────────────────
  async function createUser({ email, name, role, institutionId, departmentId, gradeId, sectionId }) {
    // Delete existing user with this email (clean slate)
    await prisma.user.deleteMany({ where: { email } })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        authProvider: 'local',
        emailVerified: true,
        role,
        institutionId,
        departmentId: departmentId || null,
        gradeId: gradeId || null,
        sectionId: sectionId || null,
        isApproved: true,
      },
    })
    return user
  }

  // ──────────────────────────────────────────────
  // COLLEGE USERS (KIT) — prefix: kit
  // ──────────────────────────────────────────────
  console.log('\n━━━ Creating COLLEGE users (KIT) ━━━')

  const collegeUsers = [
    { email: 'kitchairman@skolar.com',       name: 'KIT Chairman',        role: 'chairman' },
    { email: 'kitvicechairman@skolar.com',   name: 'KIT Vice Chairman',   role: 'vice_chairman' },
    { email: 'kitprincipal@skolar.com',      name: 'KIT Principal',       role: 'principal' },
    { email: 'kitviceprincipal@skolar.com',  name: 'KIT Vice Principal',  role: 'vice_principal' },
    { email: 'kitdean@skolar.com',           name: 'KIT Dean',            role: 'dean',  departmentId: cseDept.id },
    { email: 'kithod@skolar.com',            name: 'KIT HOD CSE',         role: 'hod',   departmentId: cseDept.id },
    { email: 'kitteacher@skolar.com',        name: 'KIT Teacher',         role: 'teacher', departmentId: cseDept.id },
    { email: 'kitstudent@skolar.com',        name: 'KIT Student',         role: 'student', departmentId: cseDept.id },
  ]

  for (const u of collegeUsers) {
    const user = await createUser({
      ...u,
      institutionId: kit.id,
    })
    console.log(`  ✅ ${u.role.padEnd(16)} → ${u.email}`)
  }

  // ──────────────────────────────────────────────
  // SCHOOL USERS (BB) — prefix: bb
  // ──────────────────────────────────────────────
  console.log('\n━━━ Creating SCHOOL users (Blue Bird) ━━━')

  const schoolUsers = [
    { email: 'bbprincipal@skolar.com',       name: 'BB Principal',        role: 'principal' },
    { email: 'bbviceprincipal@skolar.com',   name: 'BB Vice Principal',   role: 'vice_principal', gradeId: bbGradeId },
    { email: 'bbteacher@skolar.com',         name: 'BB Teacher',          role: 'teacher' },
    { email: 'bbstudent@skolar.com',         name: 'BB Student',          role: 'student', gradeId: bbGradeId, sectionId: bbSectionId },
  ]

  for (const u of schoolUsers) {
    const user = await createUser({
      ...u,
      institutionId: bb.id,
    })
    console.log(`  ✅ ${u.role.padEnd(16)} → ${u.email}`)
  }

  // ──────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 User seeding complete!\n')
  console.log('📋 All users can sign in with:')
  console.log(`   Password: ${DEFAULT_PASSWORD}\n`)

  console.log('🏛️  COLLEGE — Kalaignar Karunanidhi Institute of Technology')
  console.log('   ┌────────────────────┬─────────────────────────────────┐')
  console.log('   │ Role               │ Email                           │')
  console.log('   ├────────────────────┼─────────────────────────────────┤')
  for (const u of collegeUsers) {
    console.log(`   │ ${u.role.padEnd(18)} │ ${u.email.padEnd(31)} │`)
  }
  console.log('   └────────────────────┴─────────────────────────────────┘')

  console.log('\n🏫 SCHOOL — Blue Bird Matric Higher Secondary School')
  console.log('   ┌────────────────────┬─────────────────────────────────┐')
  console.log('   │ Role               │ Email                           │')
  console.log('   ├────────────────────┼─────────────────────────────────┤')
  for (const u of schoolUsers) {
    console.log(`   │ ${u.role.padEnd(18)} │ ${u.email.padEnd(31)} │`)
  }
  console.log('   └────────────────────┴─────────────────────────────────┘')
  console.log('')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
