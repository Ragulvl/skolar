import { useState } from 'react'
import { ClipboardCheck, ChevronLeft, ChevronRight, Calendar, TrendingUp, Building2 } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import useAPI from '../../../hooks/useAPI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function formatDate(d) { return new Date(d).toISOString().split('T')[0] }
function displayDate(d) {
  const today = formatDate(new Date())
  if (d === today) return 'Today'
  const y = new Date(); y.setDate(y.getDate() - 1)
  if (d === formatDate(y)) return 'Yesterday'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const { data, loading } = useAPI(`/college-admin/attendance?date=${selectedDate}`, { fallback: {} })

  const daily = data?.daily || {}
  const departments = data?.departments || []
  const trend = data?.trend || []

  const prevDay = () => { const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(formatDate(d)) }
  const nextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 1)
    if (formatDate(d) <= formatDate(new Date())) setSelectedDate(formatDate(d))
  }
  const isToday = selectedDate === formatDate(new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Attendance</h1>
          <p className="text-sm text-dark-200 mt-1.5">Institution-wide daily attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 text-dark-300 hover:text-dark-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700/60 border border-dark-500/25 min-w-[160px] justify-center">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-dark-100">{displayDate(selectedDate)}</span>
          </div>
          <button onClick={nextDay} disabled={isToday} className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 text-dark-300 hover:text-dark-50 transition-all disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : (daily.present || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : (daily.absent || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Late" value={loading ? '—' : (daily.late || 0).toString()} />
        <StatCard icon={TrendingUp} label="Rate" value={loading ? '—' : `${daily.percentage || 0}%`} />
      </div>

      {/* Dept cards */}
      {departments.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Department Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <div key={dept.departmentId} className="p-4 rounded-xl bg-dark-800/50 border border-dark-500/15">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/12 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark-50">{dept.name}</p>
                    <p className="text-xs text-dark-400">{dept.total} records</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    parseFloat(dept.percentage) >= 75 ? 'text-success' : parseFloat(dept.percentage) >= 50 ? 'text-amber-400' : dept.total === 0 ? 'text-dark-500' : 'text-danger'
                  }`}>{dept.total > 0 ? `${dept.percentage}%` : '—'}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-success">✓ {dept.present}</span>
                  <span className="text-danger">✗ {dept.absent}</span>
                  {dept.late > 0 && <span className="text-amber-400">◷ {dept.late}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend */}
      {trend.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
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

      {!loading && daily.total === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No attendance records for {displayDate(selectedDate)}</p>
        </div>
      )}
    </div>
  )
}
