import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/client'

export default function SchoolStudentOverview() {
  const { user } = useAuth()
  const [performanceData] = useState([])
  const [upcomingAssessments] = useState([])
  const [recentGrades] = useState([])
  const [attendance] = useState({ present: 0, absent: 0, late: 0 })

  useEffect(() => {
    // TODO: Fetch student dashboard data from assessments/attendance APIs
  }, [])

  const studentName = user?.name?.split(' ')[0] || 'Student'

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-500/10 via-violet-500/10 to-transparent border border-dark-500/25 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold font-heading">Hi {studentName} 👋</h1>
        <p className="text-sm text-dark-300 mt-2">{user?.institution?.name || '—'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">My Attendance</h3>
          <AttendanceDonut present={attendance.present} absent={attendance.absent} late={attendance.late} size={180} />
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
          {upcomingAssessments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssessments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-500/20">
                  <div>
                    <p className="text-sm font-medium text-dark-50">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.subject}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Badge>
                </div>
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
                <div key={g.subject} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-500/20">
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
