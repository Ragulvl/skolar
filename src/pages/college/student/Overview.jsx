import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/client'

export default function CollegeStudentOverview() {
  const { user } = useAuth()
  const [performanceData] = useState([])
  const [attendance] = useState({ present: 0, absent: 0, late: 0 })

  useEffect(() => {
    // TODO: Fetch student data from assessments/attendance APIs when available
  }, [])

  const studentName = user?.name?.split(' ')[0] || 'Student'
  const institutionName = user?.institution?.name || '—'

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500/10 via-brand-500/10 to-transparent border border-dark-500/25 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold font-heading">Hi {studentName} 👋</h1>
        <p className="text-sm text-dark-300 mt-2">{institutionName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 flex flex-col items-center">
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
    </div>
  )
}
