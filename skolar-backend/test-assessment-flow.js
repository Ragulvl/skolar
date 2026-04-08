import prisma from './src/config/prisma.js'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET || 'skolar-dev-secret'
const BASE = 'http://localhost:5000/api'

function makeToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' })
}

async function api(tok, method, path, body) {
  const opts = {
    method,
    headers: {
      'Cookie': `skolar_token=${tok}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const r = await fetch(`${BASE}${path}`, opts)
  const json = await r.json().catch(() => ({}))
  return { status: r.status, data: json }
}

async function run() {
  // 1. Get users
  const teacher = await prisma.user.findUnique({ where: { email: 'kitteacher@skolar.com' } })
  const student = await prisma.user.findUnique({ where: { email: 'kitstudent@skolar.com' } })
  
  if (!teacher || !student) {
    console.log('❌ Users not found')
    process.exit(1)
  }

  const tTok = makeToken(teacher.id)
  const sTok = makeToken(student.id)

  // Debug: Test auth works
  console.log('=== 0. Auth debug ===')
  const authTest = await api(tTok, 'GET', '/auth/me')
  console.log(`  Auth status: ${authTest.status}`)
  if (authTest.status !== 200) {
    console.log('  Auth response:', JSON.stringify(authTest.data))
    console.log('  Token:', tTok.substring(0, 30) + '...')
    process.exit(1)
  }
  console.log(`  User: ${authTest.data.data?.name} (${authTest.data.data?.role})`)

  // 2. Get teacher subjects
  console.log('\n=== 1. Teacher subjects ===')
  const subs = await api(tTok, 'GET', '/assessments/subjects')
  console.log(`  Status: ${subs.status}`)
  console.log(`  Subjects: ${subs.data.data?.length || 0}`)
  if (subs.data.data) subs.data.data.forEach(s => console.log(`    - ${s.name} (${s.department?.name})`))
  
  if (!subs.data.data?.length) {
    console.log('  No subjects via API. Checking DB directly...')
    const assigns = await prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id, isActive: true },
      include: { subject: { select: { id: true, name: true } } },
    })
    console.log(`  DB assignments: ${assigns.length}`)
    assigns.forEach(a => console.log(`    - ${a.subject.name} (${a.subjectId})`))
    
    if (assigns.length === 0) {
      // Create one
      const sub = await prisma.subject.findFirst({ where: { departmentId: teacher.departmentId } })
      if (sub) {
        await prisma.teacherAssignment.create({ data: { teacherId: teacher.id, subjectId: sub.id, isActive: true } })
        console.log(`  ✅ Created assignment: ${sub.name}`)
      }
    }
    console.log('  Retrying API...')
    const retry = await api(tTok, 'GET', '/assessments/subjects')
    console.log(`  Retry subjects: ${retry.data.data?.length || 0}`)
    if (!retry.data.data?.length) {
      console.log('  ❌ Still no subjects. Full response:', JSON.stringify(retry.data))
      process.exit(1)
    }
  }

  const subjectId = subs.data.data?.[0]?.id || (await prisma.teacherAssignment.findFirst({
    where: { teacherId: teacher.id, isActive: true },
    select: { subjectId: true },
  }))?.subjectId

  // 3. Create assessment
  console.log('\n=== 2. Create MCQ assessment ===')
  const create = await api(tTok, 'POST', '/assessments/create', {
    title: 'Math Quiz 1',
    type: 'mcq',
    subjectId,
    dueDate: '2026-04-30',
    questions: [
      { question: 'What is 2+2?', options: ['3', '4', '5', '6'], answer: '4' },
      { question: 'What is 5x3?', options: ['10', '12', '15', '20'], answer: '15' },
    ],
  })
  console.log(`  Status: ${create.status} (expected 201)`)
  const assessmentId = create.data.data?.id
  console.log(`  Assessment ID: ${assessmentId}`)
  console.log(`  Questions: ${create.data.data?.questions?.length}`)
  
  if (!assessmentId) {
    console.log('  ❌ Create failed:', JSON.stringify(create.data))
    process.exit(1)
  }

  // 4. Student pending
  console.log('\n=== 3. Student pending ===')
  const pending = await api(sTok, 'GET', '/assessments/pending')
  console.log(`  Pending: ${pending.data.data?.pending?.length || 0}`)
  console.log(`  Completed: ${pending.data.data?.completed?.length || 0}`)
  const match = pending.data.data?.pending?.find(a => a.id === assessmentId)
  console.log(`  "Math Quiz 1" found: ${match ? '✅' : '❌'}`)

  // 5. Student takes it
  console.log('\n=== 4. Student takes quiz ===')
  const take = await api(sTok, 'GET', `/assessments/take/${assessmentId}`)
  console.log(`  Status: ${take.status}`)
  const questions = take.data.data?.questions || []
  console.log(`  Questions: ${questions.length}`)

  const answers = {}
  questions.forEach(q => {
    if (q.question.includes('2+2')) answers[q.id] = '4'
    else if (q.question.includes('5x3')) answers[q.id] = '15'
  })

  // 6. Student submits
  console.log('\n=== 5. Submit ===')
  const submit = await api(sTok, 'POST', '/assessments/submit', { assessmentId, answers })
  console.log(`  Status: ${submit.status} (expected 201)`)
  console.log(`  Score: ${submit.data.data?.score}% (expected 100)`)
  console.log(`  Correct: ${submit.data.data?.correct}/${submit.data.data?.total}`)

  // 7. Check completed
  console.log('\n=== 6. Student completed ===')
  const after = await api(sTok, 'GET', '/assessments/pending')
  const comp = after.data.data?.completed?.find(a => a.id === assessmentId)
  console.log(`  Completed score: ${comp?.score}%`)

  // 8. Re-submit blocked
  console.log('\n=== 7. Re-submit blocked ===')
  const resub = await api(sTok, 'POST', '/assessments/submit', { assessmentId, answers })
  console.log(`  Status: ${resub.status} (expected 400)`)
  console.log(`  Error: ${resub.data.error}`)

  // 9. Teacher sees results
  console.log('\n=== 8. Teacher results ===')
  const detail = await api(tTok, 'GET', `/assessments/detail/${assessmentId}`)
  console.log(`  Submissions: ${detail.data.data?.stats?.total}`)
  console.log(`  Average: ${detail.data.data?.stats?.average}%`)

  // Cleanup
  await prisma.assessmentResult.deleteMany({ where: { assessmentId } })
  await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } })
  await prisma.assessment.delete({ where: { id: assessmentId } })
  console.log('\n  🧹 Cleanup done')

  const allPass = create.status === 201 && submit.data.data?.score === 100 && resub.status === 400
  console.log('\n' + '='.repeat(50))
  console.log(allPass ? '  ALL TESTS PASSED ✅' : '  SOME TESTS FAILED ❌')
  console.log('='.repeat(50))

  await prisma.$disconnect()
  process.exit(allPass ? 0 : 1)
}

run().catch(e => { console.error(e); process.exit(1) })
