import prisma from './src/config/prisma.js'

const teacher = await prisma.user.findUnique({ where: { email: 'kitteacher@skolar.com' }, select: { id: true, departmentId: true } })
console.log('Teacher dept:', teacher.departmentId)

const subs = await prisma.subject.findMany({ where: { departmentId: teacher.departmentId }, select: { id: true, name: true } })
console.log('Subjects in dept:', subs.length)
subs.forEach(s => console.log('  -', s.name, s.id))

const existing = await prisma.teacherAssignment.findMany({ where: { teacherId: teacher.id } })
console.log('Existing assignments:', existing.length)

if (subs.length > 0 && existing.length === 0) {
  const a = await prisma.teacherAssignment.create({ data: { teacherId: teacher.id, subjectId: subs[0].id, isActive: true } })
  console.log('✅ Created assignment for:', subs[0].name)
} else if (existing.length > 0) {
  console.log('✅ Already has assignments')
}

await prisma.$disconnect()
