import { useState } from 'react'
import { BarChart3, FileText, Download, Users, GraduationCap, TrendingUp } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import useAPI from '../../hooks/useAPI'
import AttendanceDonut from '../../components/charts/AttendanceDonut'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminReports() {
  const { data: institutions } = useAPI('/admin/institutions', { fallback: [], staleTime: 60_000 })
  const [selectedInst, setSelectedInst] = useState('')
  const { data: report, loading } = useAPI(selectedInst ? `/admin/reports/${selectedInst}` : null, { fallback: {} })

  const att = report?.attendance || {}
  const assess = report?.assessments || {}
  const users = report?.users || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">View attendance and performance reports per institution.</p>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
        <label className="text-sm font-medium text-dark-200 block mb-2">Select Institution</label>
        <select
          value={selectedInst}
          onChange={(e) => setSelectedInst(e.target.value)}
          className="w-full sm:w-80 appearance-none select-styled px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-500/40
            text-sm text-dark-50 focus:outline-none focus:border-brand-500"
        >
          <option value="">Choose institution...</option>
          {institutions.map(i => (
            <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
          ))}
        </select>
      </div>

      {selectedInst && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Attendance %" value={loading ? '—' : `${att.percentage || 0}%`} />
            <StatCard icon={TrendingUp} label="Avg Score" value={loading ? '—' : (assess.avgScore || 0).toString()} />
            <StatCard icon={GraduationCap} label="Submissions" value={loading ? '—' : (assess.totalResults || 0).toString()} />
            <StatCard icon={Users} label="Total Users" value={loading ? '—' : (users.total || 0).toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <h3 className="font-semibold font-heading mb-4">Attendance Overview</h3>
              <AttendanceDonut present={att.present || 0} absent={att.absent || 0} late={0} />
            </div>
            <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <h3 className="font-semibold font-heading mb-4">Key Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Students Enrolled', value: users.students || 0 },
                  { label: 'Teachers Active', value: users.teachers || 0 },
                  { label: 'Assessment Avg Score', value: `${assess.avgScore || 0}/100` },
                  { label: 'Total Attendance Records', value: att.total || 0 },
                ].map((metric, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dark-500/15 last:border-0">
                    <span className="text-sm text-dark-300">{metric.label}</span>
                    <span className="text-sm font-semibold text-dark-50">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Role Breakdown Chart */}
          {(users.students || users.teachers) && (
            <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <h3 className="font-semibold font-heading mb-4">User Breakdown</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Students', count: users.students || 0 },
                    { name: 'Teachers', count: users.teachers || 0 },
                    { name: 'HODs', count: users.hods || 0 },
                    { name: 'Other', count: (users.total || 0) - (users.students || 0) - (users.teachers || 0) - (users.hods || 0) },
                  ].filter(d => d.count > 0)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="count" name="Users" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedInst && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-200">Select an institution</h3>
          <p className="text-sm text-dark-400 mt-2">Choose an institution above to view its reports.</p>
        </div>
      )}
    </div>
  )
}
