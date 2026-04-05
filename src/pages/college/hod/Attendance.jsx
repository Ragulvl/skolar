import { useState } from 'react'
import { ClipboardCheck, ChevronLeft, ChevronRight, Calendar, TrendingUp, BookOpen } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function formatDate(d) {
  const dt = new Date(d)
  return dt.toISOString().split('T')[0]
}

function displayDate(d) {
  const today = formatDate(new Date())
  if (d === today) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (d === formatDate(yesterday)) return 'Yesterday'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function CollegeHODAttendance() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const { data, loading } = useAPI(`/hod/attendance?date=${selectedDate}`, { fallback: {} })

  const daily = data?.daily || {}
  const trend = data?.trend || []
  const subjects = data?.subjects || []

  const prevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(formatDate(d))
  }
  const nextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const today = formatDate(new Date())
    if (formatDate(d) <= today) setSelectedDate(formatDate(d))
  }

  const isToday = selectedDate === formatDate(new Date())

  return (
    <div className="space-y-6">
      {/* Header with date picker */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Attendance</h1>
          <p className="text-sm text-dark-200 mt-1.5">Department attendance — daily tracking.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevDay}
            className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 text-dark-300 hover:text-dark-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700/60 border border-dark-500/25 min-w-[160px] justify-center">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-dark-100">{displayDate(selectedDate)}</span>
          </div>
          <button onClick={nextDay} disabled={isToday}
            className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 text-dark-300 hover:text-dark-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : daily.present?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : daily.absent?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Late" value={loading ? '—' : daily.late?.toString() || '0'} />
        <StatCard icon={TrendingUp} label="Rate" value={loading ? '—' : `${daily.percentage || 0}%`} />
      </div>

      {/* 7-Day Trend Chart */}
      {trend.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">7-Day Trend</h3>
          <p className="text-xs text-dark-400 mb-4">Daily attendance over the past week</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date" tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(d) => {
                    const dt = new Date(d + 'T00:00:00')
                    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  }}
                />
                <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                  labelStyle={{ color: '#e0e2f0', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ fontSize: 12 }}
                  labelFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8b8fa3' }} />
                <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-subject breakdown table */}
      {subjects.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Subject Breakdown</h3>
          <p className="text-xs text-dark-400 mb-4">Attendance per subject for {displayDate(selectedDate)}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-500/20">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Subject</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Present</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Absent</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Late</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.subjectId} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-brand-400" />
                        <span className="text-dark-100 font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-success font-semibold">{s.present}</td>
                    <td className="text-center py-3 px-4 text-danger font-semibold">{s.absent}</td>
                    <td className="text-center py-3 px-4 text-amber-400 font-semibold">{s.late}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        parseFloat(s.percentage) >= 75 ? 'bg-success/12 text-success' :
                        parseFloat(s.percentage) >= 50 ? 'bg-amber-500/12 text-amber-400' :
                        'bg-danger/12 text-danger'
                      }`}>
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {!loading && daily.total === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No attendance records for {displayDate(selectedDate)}</p>
          <p className="text-dark-500 text-xs mt-1">Attendance will appear here once teachers mark it</p>
        </div>
      )}
    </div>
  )
}
