import { ClipboardCheck, TrendingUp, Users } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import GrowthLine from '../../../components/charts/GrowthLine'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolPrincipalAttendance() {
  const { user } = useAuth()
  const { data: report, loading } = useAPI(
    user?.institutionId ? `/admin/reports/${user.institutionId}` : null,
    { fallback: {} }
  )

  const att = report?.attendance || {}

  // Build chart data from the report
  const attendanceByGrade = report?.gradeBreakdown || []
  const monthlyData = report?.monthlyTrend || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Attendance Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">View attendance analytics across grades.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : (att.present || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : (att.absent || 0).toString()} />
        <StatCard icon={TrendingUp} label="Rate" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={Users} label="Total Records" value={loading ? '—' : (att.total || 0).toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Attendance by Grade</h3>
          <p className="text-xs text-dark-400 mb-4">Average attendance percentage</p>
          {attendanceByGrade.length > 0 ? (
            <PerformanceBar data={attendanceByGrade} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">
              {loading ? 'Loading...' : 'No grade-level data available'}
            </div>
          )}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Monthly Trend</h3>
          <p className="text-xs text-dark-400 mb-4">Attendance over the year</p>
          {monthlyData.length > 0 ? (
            <GrowthLine data={monthlyData} color="#22c55e" />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">
              {loading ? 'Loading...' : 'No monthly data available'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
