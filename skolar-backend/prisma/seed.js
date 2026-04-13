import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Skolar seed (Coimbatore & Palladam — normalized schema)...')
  console.log('🗑️  Wiping all existing data...')

  // Clean existing data in correct order (respecting foreign keys)
  await prisma.assessmentResult.deleteMany()
  await prisma.assessmentQuestion.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.teacherDeptAssignment.deleteMany()
  await prisma.teacherAssignment.deleteMany()
  await prisma.adminInstitutionAssignment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.section.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.department.deleteMany()
  await prisma.institution.deleteMany()

  console.log('✅ All existing data wiped clean')

  // ============================================================
  // MASTER GRADES — only 15 rows total (not per institution!)
  // ============================================================
  const gradeDefinitions = [
    { name: 'PreKG', category: 'early' }, { name: 'LKG', category: 'early' }, { name: 'UKG', category: 'early' },
    { name: '1', category: 'primary' }, { name: '2', category: 'primary' }, { name: '3', category: 'primary' },
    { name: '4', category: 'primary' }, { name: '5', category: 'middle' }, { name: '6', category: 'middle' },
    { name: '7', category: 'middle' }, { name: '8', category: 'high' }, { name: '9', category: 'high' },
    { name: '10', category: 'high' }, { name: '11', category: 'higher_sec' }, { name: '12', category: 'higher_sec' },
  ]

  const grades = {}
  for (const g of gradeDefinitions) {
    const grade = await prisma.grade.create({ data: { name: g.name, category: g.category } })
    grades[g.name] = grade
  }
  console.log(`✅ ${Object.keys(grades).length} master grades created (shared across ALL schools)`)

  // ============================================================
  // SUPER ADMIN
  // ============================================================
  await prisma.user.create({
    data: {
      name: 'Ragul Kamelash',
      email: 'ragulkamelash@gmail.com',
      role: 'superadmin',
      isApproved: true,
    }
  })
  console.log('✅ Super Admin created: ragulkamelash@gmail.com')

  // ============================================================
  // ADMINS
  // ============================================================
  const admin1 = await prisma.user.create({
    data: {
      name: 'Admin Kit',
      email: 'kit27.ad43@gmail.com',
      role: 'admin',
      isApproved: true,
    }
  })
  const admin2 = await prisma.user.create({
    data: {
      name: 'Dinez Production',
      email: 'dinez.production@gmail.com',
      role: 'admin',
      isApproved: true,
    }
  })
  console.log('✅ Admins created: kit27.ad43@gmail.com, dinez.production@gmail.com')

  // ============================================================
  // COLLEGES IN COIMBATORE (with verified TNEA / AISHE codes)
  // ============================================================
  const collegeData = [
    { name: 'PSG College of Technology', code: '2006', city: 'Coimbatore' },
    { name: 'Coimbatore Institute of Technology', code: '2007', city: 'Coimbatore' },
    { name: 'Government College of Technology', code: '2005', city: 'Coimbatore' },
    { name: 'Kumaraguru College of Technology', code: '2712', city: 'Coimbatore' },
    { name: 'Sri Krishna College of Engineering and Technology', code: '2718', city: 'Coimbatore' },
    { name: 'Kalaignar Karunanidhi Institute of Technology', code: '2750', city: 'Coimbatore' },
    { name: 'Karpagam College of Engineering', code: '2710', city: 'Coimbatore' },
    { name: 'Dr. N.G.P. Institute of Technology', code: '2736', city: 'Coimbatore' },
    { name: 'Hindusthan College of Engineering and Technology', code: '2708', city: 'Coimbatore' },
    { name: 'Amrita Vishwa Vidyapeetham', code: 'U-0436', city: 'Coimbatore' },
    { name: 'Karunya Institute of Technology and Sciences', code: 'U-0460', city: 'Coimbatore' },
    { name: 'Bharathiar University', code: 'U-0447', city: 'Coimbatore' },
    { name: 'Tamil Nadu Agricultural University', code: 'U-0485', city: 'Coimbatore' },
    { name: 'Avinashilingam Institute for Home Science and Higher Education', code: 'U-0444', city: 'Coimbatore' },
    { name: 'Karpagam Academy of Higher Education', code: 'U-0459', city: 'Coimbatore' },
    { name: 'PSG College of Arts and Science', code: 'C-41124', city: 'Coimbatore' },
    { name: 'Sri Krishna Arts and Science College', code: 'C-41117', city: 'Coimbatore' },
    { name: 'Kongunadu Arts and Science College', code: 'C-41017', city: 'Coimbatore' },
    { name: 'PSGR Krishnammal College for Women', code: 'C-41046', city: 'Coimbatore' },
    { name: 'Dr. N.G.P. Arts and Science College', code: 'C-41054', city: 'Coimbatore' },
    { name: 'Hindusthan College of Arts and Science', code: 'C-41049', city: 'Coimbatore' },
    { name: 'Nirmala College for Women', code: 'C-41069', city: 'Coimbatore' },
    { name: 'Government Arts College', code: 'C-41035', city: 'Coimbatore' },
    { name: 'Coimbatore Medical College', code: 'C-45513', city: 'Coimbatore' },
  ]

  const colleges = []
  for (const c of collegeData) {
    const college = await prisma.institution.create({
      data: { name: c.name, type: 'college', code: c.code, city: c.city }
    })
    colleges.push(college)
  }
  console.log(`✅ ${colleges.length} Coimbatore colleges created`)

  // ============================================================
  // SCHOOLS IN COIMBATORE (with verified CBSE / UDISE codes)
  // ============================================================
  const coimbatoreSchoolData = [
    { name: 'PSG Public School', code: '1930265', city: 'Coimbatore' },
    { name: 'Chinmaya International Residential School', code: '1930154', city: 'Coimbatore' },
    { name: 'SSVM World School', code: '1930279', city: 'Coimbatore' },
    { name: 'Delhi Public School', code: '1930659', city: 'Coimbatore' },
    { name: 'Stanes School CBSE', code: '1930860', city: 'Coimbatore' },
    { name: 'Rathinam International Public School', code: '1930977', city: 'Coimbatore' },
    { name: 'Yuvabharathi Public School', code: '1930204', city: 'Coimbatore' },
    { name: 'Vidhya Niketan Public School', code: '1930404', city: 'Coimbatore' },
    { name: 'The Indian Public School', code: '1930948', city: 'Coimbatore' },
    { name: 'National Model Senior Secondary School', code: '1930267', city: 'Coimbatore' },
    { name: 'Kendriya Vidyalaya', code: '1900009', city: 'Coimbatore' },
    { name: 'Amrita Vidyalayam', code: '1930444', city: 'Coimbatore' },
    { name: 'BVM Global School', code: '1930577', city: 'Coimbatore' },
    { name: 'Air Force School', code: '1980006', city: 'Coimbatore' },
    { name: 'Suguna PIP School', code: '1930213', city: 'Coimbatore' },
    { name: 'The Camford International School', code: '1930288', city: 'Coimbatore' },
    { name: 'Chandrakanthi Public School', code: '1930475', city: 'Coimbatore' },
    { name: 'Avila Convent Matriculation Higher Secondary School', code: '33120401005', city: 'Coimbatore' },
    { name: 'Lisieux Matriculation Higher Secondary School', code: '33120100105', city: 'Coimbatore' },
    { name: 'Chinmaya Vidyalaya', code: '1930459', city: 'Coimbatore' },
  ]

  const coimbatoreSchools = []
  for (const s of coimbatoreSchoolData) {
    const school = await prisma.institution.create({
      data: { name: s.name, type: 'school', code: s.code, city: s.city }
    })
    coimbatoreSchools.push(school)
  }
  console.log(`✅ ${coimbatoreSchools.length} Coimbatore schools created`)

  // ============================================================
  // SCHOOLS IN PALLADAM (with verified UDISE codes)
  // ============================================================
  const palladamSchoolData = [
    { name: 'Government Boys Higher Secondary School', code: '33331801215', city: 'Palladam' },
    { name: 'Infant Jesus Matriculation Higher Secondary School', code: '33331801904', city: 'Palladam' },
    { name: 'Adharsh Vidhyalaya Matric Higher Secondary School', code: '33331800809', city: 'Palladam' },
    { name: 'Bharathi Matric Higher Secondary School', code: '33331802005', city: 'Palladam' },
    { name: 'Blue Bird Matric Higher Secondary School', code: '33331801213', city: 'Palladam' },
    { name: 'VAT Trust Matriculation Higher Secondary School', code: '33121800307', city: 'Palladam' },
    { name: 'Infant Jesus Public School', code: '33331801809', city: 'Palladam' },
    { name: 'Government Higher Secondary School Mangalam', code: '33332201711', city: 'Palladam' },
  ]

  const palladamSchools = []
  for (const s of palladamSchoolData) {
    const school = await prisma.institution.create({
      data: { name: s.name, type: 'school', code: s.code, city: s.city }
    })
    palladamSchools.push(school)
  }
  console.log(`✅ ${palladamSchools.length} Palladam schools created`)

  // ============================================================
  // ADMIN ASSIGNMENTS
  // ============================================================
  const adminAssignments = []
  for (let i = 0; i < Math.ceil(colleges.length / 2); i++) {
    adminAssignments.push({ adminId: admin1.id, institutionId: colleges[i].id })
  }
  for (let i = Math.ceil(colleges.length / 2); i < colleges.length; i++) {
    adminAssignments.push({ adminId: admin2.id, institutionId: colleges[i].id })
  }
  for (let i = 0; i < Math.ceil(coimbatoreSchools.length / 2); i++) {
    adminAssignments.push({ adminId: admin1.id, institutionId: coimbatoreSchools[i].id })
  }
  for (let i = Math.ceil(coimbatoreSchools.length / 2); i < coimbatoreSchools.length; i++) {
    adminAssignments.push({ adminId: admin2.id, institutionId: coimbatoreSchools[i].id })
  }
  for (const school of palladamSchools) {
    adminAssignments.push({ adminId: admin2.id, institutionId: school.id })
  }
  await prisma.adminInstitutionAssignment.createMany({ data: adminAssignments })
  console.log(`✅ ${adminAssignments.length} admin-institution assignments created`)

  // ============================================================
  // DEPARTMENTS FOR COLLEGES
  // ============================================================
  const departmentNames = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ]

  console.log('⏳ Creating departments for all colleges...')
  for (const college of colleges) {
    for (const deptName of departmentNames) {
      await prisma.department.create({
        data: { name: deptName, institutionId: college.id }
      })
    }
  }
  console.log(`✅ Departments created (${departmentNames.length} per college, ${departmentNames.length * colleges.length} total)`)

  // ============================================================
  // SECTIONS FOR ALL SCHOOLS
  // Sections reference master grades + institutionId
  // No grade duplication — just linking!
  // ============================================================
  const allSchools = [...coimbatoreSchools, ...palladamSchools]
  const gradeNames = Object.keys(grades)
  const sectionNames = ['A', 'B', 'C']

  console.log(`⏳ Creating sections for all ${allSchools.length} schools...`)

  for (let i = 0; i < allSchools.length; i++) {
    const school = allSchools[i]
    const sectionData = []

    for (const gradeName of gradeNames) {
      for (const secName of sectionNames) {
        sectionData.push({
          name: secName,
          gradeId: grades[gradeName].id,
          institutionId: school.id,
        })
      }
    }

    // Batch create all sections for this school in one call
    await prisma.section.createMany({ data: sectionData })

    if ((i + 1) % 7 === 0 || i === allSchools.length - 1) {
      console.log(`   ↳ ${i + 1}/${allSchools.length} schools done...`)
    }
  }
  console.log(`✅ Sections created for all ${allSchools.length} schools (${allSchools.length * 15 * 3} total)`)

  // ============================================================
  // DEMO USERS — Kalaignar Karunanidhi Institute of Technology (College)
  // Format: kit<role>@skolar.com  |  Password: skolar123
  // ============================================================
  const demoPassword = await bcrypt.hash('skolar123', 12)

  const kitCollege = colleges.find(c => c.name === 'Kalaignar Karunanidhi Institute of Technology')
  const kitDepts = await prisma.department.findMany({ where: { institutionId: kitCollege.id } })
  const kitCSE = kitDepts.find(d => d.name === 'Computer Science and Engineering')
  const kitIT = kitDepts.find(d => d.name === 'Information Technology')

  // Principal
  await prisma.user.create({
    data: { name: 'KIT Principal', email: 'kitprincipal@skolar.com', role: 'principal', institutionId: kitCollege.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Vice Principal
  await prisma.user.create({
    data: { name: 'KIT Vice Principal', email: 'kitviceprincipal@skolar.com', role: 'vice_principal', institutionId: kitCollege.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Chairman
  await prisma.user.create({
    data: { name: 'KIT Chairman', email: 'kitchairman@skolar.com', role: 'chairman', institutionId: kitCollege.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Vice Chairman
  await prisma.user.create({
    data: { name: 'KIT Vice Chairman', email: 'kitvicechairman@skolar.com', role: 'vice_chairman', institutionId: kitCollege.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Dean (CSE department)
  await prisma.user.create({
    data: { name: 'KIT Dean', email: 'kitdean@skolar.com', role: 'dean', institutionId: kitCollege.id, departmentId: kitCSE.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // HOD (CSE department)
  await prisma.user.create({
    data: { name: 'KIT HOD', email: 'kithod@skolar.com', role: 'hod', institutionId: kitCollege.id, departmentId: kitCSE.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Teacher (IT department)
  await prisma.user.create({
    data: { name: 'KIT Teacher', email: 'kitteacher@skolar.com', role: 'teacher', institutionId: kitCollege.id, departmentId: kitIT.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Student (CSE department)
  await prisma.user.create({
    data: { name: 'KIT Student', email: 'kitstudent@skolar.com', role: 'student', institutionId: kitCollege.id, departmentId: kitCSE.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  console.log('✅ 8 KIT college demo users created (kit<role>@skolar.com)')

  // ============================================================
  // DEMO USERS — Blue Bird Matric Higher Secondary School (School)
  // Format: bb<role>@skolar.com
  // ============================================================
  const bbSchool = palladamSchools.find(s => s.name === 'Blue Bird Matric Higher Secondary School')
  const bbSection = await prisma.section.findFirst({
    where: { institutionId: bbSchool.id, name: 'A', grade: { name: '10' } }
  })
  const bbGrade10 = grades['10']

  // Principal
  await prisma.user.create({
    data: { name: 'BB Principal', email: 'bbprincipal@skolar.com', role: 'principal', institutionId: bbSchool.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Vice Principal
  await prisma.user.create({
    data: { name: 'BB Vice Principal', email: 'bbviceprincipal@skolar.com', role: 'vice_principal', institutionId: bbSchool.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Teacher
  await prisma.user.create({
    data: { name: 'BB Teacher', email: 'bbteacher@skolar.com', role: 'teacher', institutionId: bbSchool.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  // Student (Grade 10, Section A)
  await prisma.user.create({
    data: { name: 'BB Student', email: 'bbstudent@skolar.com', role: 'student', institutionId: bbSchool.id, gradeId: bbGrade10.id, sectionId: bbSection.id, isApproved: true, passwordHash: demoPassword, authProvider: 'local' }
  })
  console.log('✅ 4 Blue Bird school demo users created (bb<role>@skolar.com)')

  // ============================================================
  // SUMMARY
  // ============================================================
  const totalInstitutions = await prisma.institution.count()
  const totalUsers = await prisma.user.count()
  const totalDepts = await prisma.department.count()
  const totalGrades = await prisma.grade.count()
  const totalSections = await prisma.section.count()

  console.log('\n🎉 Seed complete!')
  console.log('━'.repeat(50))
  console.log(`📊 Database Summary:`)
  console.log(`   Institutions: ${totalInstitutions}`)
  console.log(`     ├─ Colleges (Coimbatore): ${colleges.length}`)
  console.log(`     ├─ Schools (Coimbatore):  ${coimbatoreSchools.length}`)
  console.log(`     └─ Schools (Palladam):    ${palladamSchools.length}`)
  console.log(`   Users:        ${totalUsers}`)
  console.log(`   Departments:  ${totalDepts}`)
  console.log(`   Grades:       ${totalGrades} ← Master table (shared!)`)
  console.log(`   Sections:     ${totalSections}`)
  console.log('━'.repeat(50))
  console.log(`\n👤 Super Admin:  ragulkamelash@gmail.com`)
  console.log(`👤 Admin 1:      kit27.ad43@gmail.com`)
  console.log(`👤 Admin 2:      dinez.production@gmail.com`)
  console.log('\n📋 All users authenticate via Google OAuth.')
  console.log('\n🔧 Redundancies removed:')
  console.log('   ✗ Grade.institutionId → Grade is now a master lookup')
  console.log('   ✗ User.institutionType → derive from institution.type')
  console.log('   ✗ TeacherAssignment.gradeId → derive from section.gradeId')
  console.log('   ✗ Attendance.institutionId → derive from student.institutionId')
  console.log('   ✗ Assessment.institutionId → derive from creator.institutionId')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
