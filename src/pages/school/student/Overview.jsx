import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badge'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolStudentOverview() {
  const { user } = useAuth()
  const { data: dashboard, loading } = useAPI('/student/dashboard', { fallback: {} })
  const { data: assessments } = useAPI('/student/assessments', { fallback: [] })

  const studentName = user?.name?.split(' ')[0] || 'Student'
  const att = dashboard?.attendance || {}
  const subjects = dashboard?.subjects || []

  // Derive performance data from assessments
  const performanceData = assessments
    .filter(a => a.result)
    .slice(0, 6)
    .map(a => ({
      subject: a.subject?.name || '—',
      score: Math.round(a.result?.score || 0),
    }))

  // Upcoming = no result yet and dueDate in future
  const upcoming = assessments
    .filter(a => !a.result && new Date(a.dueDate) > new Date())
    .slice(0, 5)

  // Recent graded
  const recentGrades = assessments
    .filter(a => a.result)
    .slice(0, 5)
    .map(a => ({
      subject: a.subject?.name || '—',
      score: Math.round(a.result?.score || 0),
      grade: a.result?.score >= 90 ? 'A+' : a.result?.score >= 80 ? 'A' : a.result?.score >= 70 ? 'B' : a.result?.score >= 60 ? 'C' : 'D',
      id: a.id,
    }))

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-500/10 via-violet-500/10 to-transparent border border-dark-500/25 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold font-heading">Hi {studentName} 👋</h1>
        <p className="text-sm text-dark-300 mt-2">{user?.institution?.name || '—'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">My Attendance</h3>
          <AttendanceDonut present={att.present || 0} absent={att.absent || 0} late={att.late || 0} size={180} />
        </div>
        <div className="lg:col-span-2 bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Subject Performance</h3>
          <p className="text-xs text-dark-400 mb-4">Latest assessment scores</p>
          {performanceData.length > 0 ? (
            <PerformanceBar data={performanceData} height={220} />
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-dark-400">No assessments yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Upcoming Assessments</h3>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map(a => (
                <Link key={a.id} to="/dashboard/school/student/assessments"
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-500/20 hover:border-brand-500/30 hover:bg-dark-700/60 transition-all group">
                  <div>
                    <p className="text-sm font-medium text-dark-50">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.subject?.name || '—'}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-6">No upcoming assessments.</p>
          )}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Recent Grades</h3>
          {recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-500/20">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-brand-400" />
                    <span className="text-sm text-dark-100">{g.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark-50">{g.score}%</span>
                    <Badge variant="success" size="sm">{g.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-6">No grades available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
