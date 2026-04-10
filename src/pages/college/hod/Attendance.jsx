import { useState, useEffect } from 'react'
import { ClipboardCheck, ChevronLeft, ChevronRight, Calendar, TrendingUp, BookOpen, Check, X, Clock, Users, Loader2, CheckCircle2 } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function formatDate(d) { return new Date(d).toISOString().split('T')[0] }
function displayDate(d) {
  const today = formatDate(new Date())
  if (d === today) return 'Today'
  const y = new Date(); y.setDate(y.getDate() - 1)
  if (d === formatDate(y)) return 'Yesterday'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

const STATUS_CFG = {
  present: { label: 'P', active: 'bg-success text-white border-success', idle: 'bg-success/15 text-success border-success/30' },
  absent: { label: 'A', active: 'bg-danger text-white border-danger', idle: 'bg-danger/15 text-danger border-danger/30' },
  late: { label: 'L', active: 'bg-amber-500 text-white border-amber-500', idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
}

export default function CollegeHODAttendance() {
  const [tab, setTab] = useState('view')
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Attendance</h1>
          <p className="text-sm text-dark-200 mt-1.5">Department attendance — view & mark.</p>
        </div>
        <div className="flex rounded-xl bg-dark-700/60 border border-dark-500/25 overflow-hidden">
          <button onClick={() => setTab('view')} className={`px-4 py-2 text-sm font-medium transition-all ${tab === 'view' ? 'bg-brand-500/15 text-brand-300' : 'text-dark-400 hover:text-dark-200'}`}>
            View Stats
          </button>
          <button onClick={() => setTab('mark')} className={`px-4 py-2 text-sm font-medium transition-all ${tab === 'mark' ? 'bg-brand-500/15 text-brand-300' : 'text-dark-400 hover:text-dark-200'}`}>
            Mark Attendance
          </button>
        </div>
      </div>

      {tab === 'view' ? <AttendanceView selectedDate={selectedDate} setSelectedDate={setSelectedDate} /> : <MarkAttendanceTab />}
    </div>
  )
}

function AttendanceView({ selectedDate, setSelectedDate }) {
  const { data, loading } = useAPI(`/hod/attendance?date=${selectedDate}`, { fallback: {} })
  const daily = data?.daily || {}
  const trend = data?.trend || []
  const subjects = data?.subjects || []
  const prevDay = () => { const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(formatDate(d)) }
  const nextDay = () => { const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 1); if (formatDate(d) <= formatDate(new Date())) setSelectedDate(formatDate(d)) }
  const isToday = selectedDate === formatDate(new Date())

  return (
    <>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : daily.present?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : daily.absent?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Late" value={loading ? '—' : daily.late?.toString() || '0'} />
        <StatCard icon={TrendingUp} label="Rate" value={loading ? '—' : `${daily.percentage || 0}%`} />
      </div>

      {trend.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">7-Day Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Subject Breakdown</h3>
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
                  <td className="py-3 px-4"><div className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-brand-400" /><span className="text-dark-100 font-medium">{s.name}</span></div></td>
                  <td className="text-center py-3 px-4 text-success font-semibold">{s.present}</td>
                  <td className="text-center py-3 px-4 text-danger font-semibold">{s.absent}</td>
                  <td className="text-center py-3 px-4 text-amber-400 font-semibold">{s.late}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseFloat(s.percentage) >= 75 ? 'bg-success/12 text-success' : parseFloat(s.percentage) >= 50 ? 'bg-amber-500/12 text-amber-400' : 'bg-danger/12 text-danger'}`}>{s.percentage}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && daily.total === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No attendance records for {displayDate(selectedDate)}</p>
        </div>
      )}
    </>
  )
}

function MarkAttendanceTab() {
  const { data: assignData } = useAPI('/attendance/my-assignments', { fallback: {} })
  const assignments = assignData?.assignments || []
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [statuses, setStatuses] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { data: markData, loading: loadingStudents } = useAPI(
    selectedSubject ? `/attendance/markable-students/${selectedSubject}?date=${selectedDate}` : null,
    { fallback: {} }
  )
  const students = markData?.students || []
  const existing = markData?.existing || []

  useEffect(() => {
    if (existing.length > 0) {
      const map = {}; existing.forEach(e => { map[e.studentId] = e.status }); setStatuses(map); setSubmitted(true)
    } else { setStatuses({}); setSubmitted(false) }
  }, [JSON.stringify(existing)])

  const markAll = () => { if (submitted) return; const m = {}; students.forEach(s => { m[s.id] = 'present' }); setStatuses(m) }
  const markedCount = Object.keys(statuses).length
  const allMarked = markedCount === students.length && students.length > 0

  const handleSubmit = async () => {
    if (!allMarked || submitting) return; setSubmitting(true)
    try {
      const records = students.map(s => ({ studentId: s.id, status: statuses[s.id] }))
      const resp = await api.post('/attendance/mark', { subjectId: selectedSubject, date: selectedDate, records })
      if (resp.data.success) { setSubmitted(true); invalidateCache('/attendance'); invalidateCache('/hod/attendance') }
    } catch (err) { console.error(err) } finally { setSubmitting(false) }
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Subject</label>
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setStatuses({}); setSubmitted(false) }}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50 appearance-none">
            <option value="">Select a subject...</option>
            {assignments.map(a => <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Date</label>
          <input type="date" value={selectedDate} max={formatDate(new Date())} onChange={e => { setSelectedDate(e.target.value); setStatuses({}); setSubmitted(false) }}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50" />
        </div>
        {students.length > 0 && !submitted && (
          <button onClick={markAll} className="px-4 py-2.5 rounded-xl bg-success/10 border border-success/25 text-success text-sm font-medium hover:bg-success/20 transition-all">
            <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Mark All Present
          </button>
        )}
      </div>

      {selectedSubject && (loadingStudents ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 text-brand-400 mx-auto animate-spin" /></div>
      ) : students.length > 0 ? (
        <>
          {submitted && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" /><p className="text-sm text-success">Attendance already marked.</p>
            </div>
          )}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-500/15">
              <div className="flex items-center gap-2.5"><Users className="w-5 h-5 text-brand-400" /><span className="font-semibold text-dark-100">{markData?.subjectName}</span></div>
              <span className="text-xs text-dark-400">{markedCount}/{students.length} marked</span>
            </div>
            <div className="divide-y divide-dark-500/10">
              {students.map((s, idx) => (
                <div key={s.id} className={`flex items-center gap-4 px-6 py-3 ${idx % 2 === 0 ? 'bg-dark-800/20' : ''}`}>
                  <span className="text-xs text-dark-500 w-6">{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand-500/12 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                    {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-dark-100">{s.name}</p></div>
                  <div className="flex gap-2">
                    {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                      <button key={key} onClick={() => !submitted && setStatuses(p => ({ ...p, [s.id]: key }))} disabled={submitted}
                        className={`w-9 h-9 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${statuses[s.id] === key ? cfg.active : cfg.idle} ${submitted ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {!submitted && (
            <div className="flex justify-end">
              <button onClick={handleSubmit} disabled={!allMarked || submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-brand-500/20 transition-all">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                {submitting ? 'Submitting...' : `Submit (${markedCount}/${students.length})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <Users className="w-10 h-10 text-dark-500 mx-auto mb-3" /><p className="text-sm text-dark-400">No students found.</p>
        </div>
      ))}
    </>
  )
}
