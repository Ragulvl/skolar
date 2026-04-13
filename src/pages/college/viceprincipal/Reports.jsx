import { BarChart3, FileText, Users, TrendingUp, Building2, ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import useAPI from '../../../hooks/useAPI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function CollegeVPReports() {
  const { data: attData, loading: loadingAtt } = useAPI('/college-admin/attendance?date=' + new Date().toISOString().split('T')[0], { fallback: {} })
  const { data: analytics, loading: loadingAnalytics } = useAPI('/college-admin/analytics', { fallback: {} })

  const daily = attData?.daily || {}
  const departments = attData?.departments || []
  const trend = attData?.trend || []
  const assess = analytics?.assessmentOverall || {}

  const loading = loadingAtt || loadingAnalytics

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Performance summary for your assigned departments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Attendance %" value={loading ? '—' : `${daily.percentage || 0}%`} />
        <StatCard icon={Users} label="Present" value={loading ? '—' : (daily.present || 0).toString()} />
        <StatCard icon={Users} label="Absent" value={loading ? '—' : (daily.absent || 0).toString()} />
        <StatCard icon={TrendingUp} label="Avg Assessment" value={loading ? '—' : `${assess.avgScore || 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Attendance Overview</h3>
          <div className="max-w-xs mx-auto">
            <AttendanceDonut present={daily.present || 0} absent={daily.absent || 0} late={daily.late || 0} />
          </div>
        </div>

        {/* Department Breakdown */}
        {departments.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-4">Department Attendance</h3>
            <div className="space-y-3">
              {departments.map(dept => (
                <div key={dept.departmentId} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/12 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-50">{dept.name}</p>
                      <p className="text-xs text-dark-400">{dept.total} records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className="text-success">✓ {dept.present}</span>
                      <span className="text-danger">✗ {dept.absent}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      parseFloat(dept.percentage) >= 75 ? 'text-success' : parseFloat(dept.percentage) >= 50 ? 'text-amber-400' : dept.total === 0 ? 'text-dark-500' : 'text-danger'
                    }`}>{dept.total > 0 ? `${dept.percentage}%` : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-Day Trend */}
        {trend.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-semibold font-heading mb-4">7-Day Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                  <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Summary Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Attendance Records', value: daily.total || 0 },
              { label: 'Present', value: daily.present || 0 },
              { label: 'Absent', value: daily.absent || 0 },
              { label: 'Late', value: daily.late || 0 },
              { label: 'Attendance Rate', value: `${daily.percentage || 0}%` },
              { label: 'Assessment Avg Score', value: assess.avgScore || 0 },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-500/15 last:border-0">
                <span className="text-sm text-dark-300">{m.label}</span>
                <span className="text-sm font-semibold text-dark-50">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
