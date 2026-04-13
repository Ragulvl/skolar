import {
  BarChart3, Users, ClipboardList, FileText, TrendingUp
} from 'lucide-react'
import PieBreakdown from '../../components/charts/PieBreakdown'
import PerformanceBar from '../../components/charts/PerformanceBar'
import { useMultiAPI } from '../../hooks/useAPI'

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  chairman: 'Chairman',
  vice_chairman: 'Vice Chairman',
  dean: 'Dean',
  hod: 'HOD',
  teacher: 'Teacher',
  student: 'Student',
  pending: 'Pending',
}

export default function SuperAdminAnalytics() {
  const { data: apiData, loading } = useMultiAPI([
    { url: '/superadmin/analytics/enhanced', key: 'analytics', staleTime: 120_000 },
    { url: '/superadmin/stats', key: 'stats', staleTime: 60_000 },
  ])

  const data = apiData.analytics
  const stats = apiData.stats

  const emptyChart = (label) => (
    <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">{label}</div>
  )

  // Prepare chart data
  const roleDistPie = data?.roleDistribution
    ?.filter(r => r.role !== 'superadmin')
    .map(r => ({ name: ROLE_LABELS[r.role] || r.role, value: r.count })) || []

  const instUsersBars = data?.institutionUsers
    ?.map(i => ({ subject: i.name.length > 20 ? i.name.slice(0, 20) + '…' : i.name, score: i.users })) || []

  const regionBars = data?.regionData
    ?.map(r => ({ subject: r.city, score: r.count })) || []

  const attendanceData = data?.attendanceStats || {}
  const totalAttendance = Object.values(attendanceData).reduce((a, b) => a + b, 0)
  const attendancePie = totalAttendance > 0
    ? Object.entries(attendanceData).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
    : []

  const monthlyBars = data?.monthlySignups
    ?.map(m => ({
      subject: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      score: m.count,
    })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Platform Analytics</h1>
        <p className="text-sm text-dark-200 mt-1.5">Comprehensive data across all institutions.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Institutions', value: stats?.total, icon: BarChart3, color: 'brand' },
          { label: 'Users', value: stats?.users, icon: Users, color: 'blue' },
          { label: 'Teachers', value: stats?.teachers, icon: Users, color: 'emerald' },
          { label: 'Students', value: stats?.students, icon: Users, color: 'violet' },
          { label: 'Assessments', value: stats?.assessments, icon: FileText, color: 'amber' },
          { label: 'Attendance', value: stats?.attendance, icon: ClipboardList, color: 'pink' },
        ].map(item => (
          <div key={item.label} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-extrabold font-heading text-${item.color}-400`}>
              {loading ? '—' : item.value || 0}
            </p>
            <p className="text-xs text-dark-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Assessment & Attendance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Avg Assessment Score</p>
              <p className="text-xl font-bold font-heading text-dark-50">
                {loading ? '—' : data?.assessmentStats?.avgScore
                  ? `${Math.round(data.assessmentStats.avgScore)}%`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-500">
            {data?.assessmentStats?.results || 0} total submissions across {data?.assessmentStats?.total || 0} assessments
          </p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Attendance Records</p>
              <p className="text-xl font-bold font-heading text-dark-50">
                {loading ? '—' : totalAttendance.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-500">
            {attendanceData.present || 0} present · {attendanceData.absent || 0} absent · {attendanceData.late || 0} late
          </p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Growth Trends</p>
              <p className="text-xl font-bold font-heading text-dark-50">
                {loading ? '—' : data?.monthlySignups?.length || 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-500">Months of tracked signup data</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">User Distribution by Role</h3>
          <p className="text-xs text-dark-400 mb-4">Breakdown of all users across roles</p>
          {roleDistPie.length > 0 ? <PieBreakdown data={roleDistPie} /> : emptyChart('No user data')}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Users per Institution</h3>
          <p className="text-xs text-dark-400 mb-4">Top 10 institutions by user count</p>
          {instUsersBars.length > 0 ? <PerformanceBar data={instUsersBars} /> : emptyChart('No data yet')}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Attendance Breakdown</h3>
          <p className="text-xs text-dark-400 mb-4">Platform-wide attendance status distribution</p>
          {attendancePie.length > 0 ? <PieBreakdown data={attendancePie} /> : emptyChart('No attendance data')}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Regional Distribution</h3>
          <p className="text-xs text-dark-400 mb-4">Institutions by city</p>
          {regionBars.length > 0 ? <PerformanceBar data={regionBars} /> : emptyChart('No data yet')}
        </div>
      </div>

      {/* Monthly Signups */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" /> Monthly User Signups
        </h3>
        <p className="text-xs text-dark-400 mb-4">New user registrations over the last 6 months</p>
        {monthlyBars.length > 0 ? <PerformanceBar data={monthlyBars} /> : emptyChart('No signup data yet')}
      </div>
    </div>
  )
}
