import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from './config/passport.config.js'
import authRoutes from './routes/auth.routes.js'
import superadminRoutes from './routes/superadmin.routes.js'
import adminRoutes from './routes/admin.routes.js'
import schoolRoutes from './routes/school.routes.js'

import deanRoutes from './routes/dean.routes.js'
import hodRoutes from './routes/hod.routes.js'
import viceprincipalRoutes from './routes/viceprincipal.routes.js'
import attendanceRoutes from './routes/attendance.routes.js'
import assessmentRoutes from './routes/assessment.routes.js'
import collegeAdminRoutes from './routes/college-admin.routes.js'
import teacherRoutes from './routes/teacher.routes.js'
import studentRoutes from './routes/student.routes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'operational', timestamp: new Date().toISOString() } })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/school', schoolRoutes)

app.use('/api/dean', deanRoutes)
app.use('/api/hod', hodRoutes)
app.use('/api/viceprincipal', viceprincipalRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/college-admin', collegeAdminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/student', studentRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Skolar API running on port ${PORT}`)
})
