import { Building2, Users, ClipboardList, FileText } from 'lucide-react'
import useAPI from '../../hooks/useAPI'

const ROLE_LABELS = {
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

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#f97316',
]

export default function AdminAnalytics() {
  const { data: analytics, loading: aLoading } = useAPI('/admin/analytics', { staleTime: 120_000, fallback: null })
  const { data: overview, loading: oLoading } = useAPI('/admin/overview', { staleTime: 60_000, fallback: null })

  const loading = aLoading || oLoading

  const roleDistribution = (analytics && analytics.roleDistribution) ? analytics.roleDistribution : []
  const institutionUsers = (analytics && analytics.institutionUsers) ? analytics.institutionUsers : []
  const attendanceData = (analytics && analytics.attendanceOverall) ? analytics.attendanceOverall : {}
  const assessmentData = (analytics && analytics.assessmentOverall) ? analytics.assessmentOverall : {}
  const totalAttendance = attendanceData.total || 0

  const statItems = [
    { label: 'Institutions', value: overview ? overview.institutions : 0, iconEl: Building2, cls: 'text-brand-400' },
    { label: 'Total Users', value: overview ? overview.totalUsers : 0, iconEl: Users, cls: 'text-blue-400' },
    { label: 'Teachers', value: overview ? overview.teachers : 0, iconEl: Users, cls: 'text-emerald-400' },
    { label: 'Students', value: overview ? overview.students : 0, iconEl: Users, cls: 'text-violet-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Analytics</h1>
        <p className="text-sm text-dark-200 mt-1.5">Insights across your assigned institutions.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map(function(item) {
          var Icon = item.iconEl
          return (
            <div key={item.label} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-dark-600/40 flex items-center justify-center mx-auto mb-2">
                <Icon className={'w-4 h-4 ' + item.cls} />
              </div>
              <p className={'text-2xl font-extrabold font-heading ' + item.cls}>
                {loading ? '—' : String(item.value || 0)}
              </p>
              <p className="text-xs text-dark-400 mt-1">{item.label}</p>
            </div>
          )
        })}
      </div>

      {/* Assessment & Attendance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Avg Assessment Score</p>
              <p className="text-xl font-bold font-heading text-dark-50">
                {loading ? '—' : (assessmentData.avgScore ? String(assessmentData.avgScore) + '%' : 'N/A')}
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-500">
            {String(assessmentData.totalResults || 0)} total submissions across all institutions
          </p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Attendance Rate</p>
              <p className="text-xl font-bold font-heading text-dark-50">
                {loading ? '—' : (attendanceData.percentage ? String(attendanceData.percentage) + '%' : 'N/A')}
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-500">
            {String(attendanceData.present || 0)} present · {String(attendanceData.absent || 0)} absent · {String(attendanceData.late || 0)} late
          </p>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-1">User Distribution by Role</h3>
        <p className="text-xs text-dark-400 mb-5">Breakdown of users across all assigned institutions</p>
        {roleDistribution.length > 0 ? (
          <div className="space-y-3">
            {roleDistribution
              .slice()
              .sort(function(a, b) { return b.count - a.count })
              .map(function(item, idx) {
                var maxCount = 1
                for (var i = 0; i < roleDistribution.length; i++) {
                  if (roleDistribution[i].count > maxCount) maxCount = roleDistribution[i].count
                }
                var pct = (item.count / maxCount) * 100
                return (
                  <div key={item.role || idx} className="flex items-center gap-3">
                    <span className="text-xs text-dark-300 w-28 text-right truncate">
                      {ROLE_LABELS[item.role] || item.role}
                    </span>
                    <div className="flex-1 h-7 rounded-lg bg-dark-800/40 overflow-hidden relative">
                      <div
                        className="h-full rounded-lg"
                        style={{
                          width: Math.max(pct, 2) + '%',
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          opacity: 0.7,
                        }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-dark-200">
                        {String(item.count)}
                      </span>
                    </div>
                  </div>
                )
              })
            }
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-dark-400">No user data available</div>
        )}
      </div>

      {/* Users per Institution */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-1">Users per Institution</h3>
        <p className="text-xs text-dark-400 mb-5">User count across your assigned institutions</p>
        {institutionUsers.length > 0 ? (
          <div className="space-y-3">
            {institutionUsers.map(function(inst, idx) {
              var maxUsers = 1
              for (var i = 0; i < institutionUsers.length; i++) {
                if (institutionUsers[i].users > maxUsers) maxUsers = institutionUsers[i].users
              }
              var pct = (inst.users / maxUsers) * 100
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-dark-300 w-36 text-right truncate">{inst.name}</span>
                  <div className="flex-1 h-7 rounded-lg bg-dark-800/40 overflow-hidden relative">
                    <div
                      className="h-full rounded-lg"
                      style={{
                        width: Math.max(pct, 2) + '%',
                        background: inst.type === 'school'
                          ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                          : 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                        opacity: 0.7,
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-dark-200">
                      {String(inst.users)}
                    </span>
                  </div>
                  <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded ' +
                    (inst.type === 'school' ? 'bg-brand-500/10 text-brand-400' : 'bg-violet-500/10 text-violet-400')}>
                    {inst.type}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-dark-400">No institution data</div>
        )}
      </div>

      {/* Attendance Breakdown */}
      {totalAttendance > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Attendance Breakdown</h3>
          <p className="text-xs text-dark-400 mb-5">Aggregated attendance across all institutions</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
              <p className="text-2xl font-extrabold font-heading text-emerald-400">
                {String(attendanceData.present || 0)}
              </p>
              <p className="text-[11px] text-dark-400 mt-1 uppercase tracking-wider">Present</p>
              <p className="text-xs font-medium mt-1 text-emerald-400">
                {totalAttendance > 0 ? ((attendanceData.present || 0) / totalAttendance * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
              <p className="text-2xl font-extrabold font-heading text-red-400">
                {String(attendanceData.absent || 0)}
              </p>
              <p className="text-[11px] text-dark-400 mt-1 uppercase tracking-wider">Absent</p>
              <p className="text-xs font-medium mt-1 text-red-400">
                {totalAttendance > 0 ? ((attendanceData.absent || 0) / totalAttendance * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
              <p className="text-2xl font-extrabold font-heading text-amber-400">
                {String(attendanceData.late || 0)}
              </p>
              <p className="text-[11px] text-dark-400 mt-1 uppercase tracking-wider">Late</p>
              <p className="text-xs font-medium mt-1 text-amber-400">
                {totalAttendance > 0 ? ((attendanceData.late || 0) / totalAttendance * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
