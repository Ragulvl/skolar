import { Building2, Users, GraduationCap, TrendingUp, FileText, ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import useAPI from '../../../hooks/useAPI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']

export default function ReportsPage() {
  const { data, loading } = useAPI('/college-admin/analytics', { fallback: {} })
  const { data: attData } = useAPI('/college-admin/attendance?date=' + new Date().toISOString().split('T')[0], { fallback: {} })

  const deptPerf = data?.departmentPerformance || []
  const roleDist = data?.roleDistribution || []
  const att = attData?.daily || {}
  const assess = data?.assessmentOverall || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Institution-wide performance reports and analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Building2} label="Departments" value={loading ? '—' : deptPerf.length.toString()} />
        <StatCard icon={TrendingUp} label="Attendance Today" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={GraduationCap} label="Avg Score" value={loading ? '—' : (assess.avgScore || 0).toString()} />
        <StatCard icon={Users} label="Total Submissions" value={loading ? '—' : (assess.totalResults || 0).toString()} />
        <StatCard icon={FileText} label="Attendance Records" value={loading ? '—' : (att.total || 0).toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Donut */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Today's Attendance</h3>
          <div className="max-w-xs mx-auto">
            <AttendanceDonut present={att.present || 0} absent={att.absent || 0} late={att.late || 0} />
          </div>
        </div>

        {/* Department comparison */}
        {deptPerf.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-4">Department Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerf}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="teachers" name="Teachers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="subjects" name="Subjects" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Role distribution */}
        {roleDist.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-4">Role Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDist} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    label={({ role, count }) => `${role}: ${count}`} labelLine={false}>
                    {roleDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Summary Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Present Today', value: att.present || 0 },
              { label: 'Absent Today', value: att.absent || 0 },
              { label: 'Late Today', value: att.late || 0 },
              { label: 'Assessment Avg Score', value: `${assess.avgScore || 0}/100` },
              { label: 'Total Submissions', value: assess.totalResults || 0 },
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
