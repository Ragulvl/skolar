import { useState, useEffect } from 'react'
import { ClipboardCheck, Check, X, Clock, Users, Loader2, CheckCircle2 } from 'lucide-react'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

function formatDate(d) { return new Date(d).toISOString().split('T')[0] }

const STATUS_CFG = {
  present: { label: 'P', active: 'bg-success text-white border-success', idle: 'bg-success/15 text-success border-success/30' },
  absent: { label: 'A', active: 'bg-danger text-white border-danger', idle: 'bg-danger/15 text-danger border-danger/30' },
  late: { label: 'L', active: 'bg-amber-500 text-white border-amber-500', idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
}

export default function SchoolTeacherAttendance() {
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
      if (resp.data.success) { setSubmitted(true); invalidateCache('/attendance') }
    } catch (err) { console.error(err) } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Mark Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Mark daily attendance for your class.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Subject / Class</label>
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setStatuses({}); setSubmitted(false) }}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50 appearance-none select-styled">
            <option value="">Select a class...</option>
            {assignments.map(a => <option key={a.subjectId} value={a.subjectId}>{a.subjectName}{a.sectionName ? ` — ${a.gradeName} ${a.sectionName}` : ''}</option>)}
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
    </div>
  )
}
