import { useState } from 'react'
import { FileText, Plus, Eye, Trash2, CheckCircle2, Loader2, Building2 } from 'lucide-react'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

export default function CollegeDeanAssessments() {
  const { data: assessments, loading } = useAPI('/assessments/my', { fallback: [] })
  const { data: subjects } = useAPI('/assessments/subjects', { fallback: [] })
  const [showCreate, setShowCreate] = useState(false)
  const [viewId, setViewId] = useState(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
          <p className="text-sm text-dark-200 mt-1.5">Assessments across your managed departments.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:shadow-lg hover:shadow-brand-500/20 transition-all">
          <Plus className="w-4 h-4" /> Create Assessment
        </button>
      </div>

      {showCreate && <CreateForm subjects={subjects} onClose={() => setShowCreate(false)} />}
      {viewId && <DetailView assessmentId={viewId} onClose={() => setViewId(null)} />}

      {(assessments || []).length > 0 ? (
        <div className="space-y-3">
          {assessments.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/60 border border-dark-500/25 hover:border-dark-400/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/12 flex items-center justify-center"><FileText className="w-5 h-5 text-violet-400" /></div>
                <div>
                  <p className="font-medium text-dark-50 text-sm">{a.title}</p>
                  <p className="text-xs text-dark-400">
                    <Building2 className="w-3 h-3 inline mr-1" />{a.subject?.department?.name || ''} · {a.subject?.name} · {a.type} · {a._count?.questions || 0}Q · {a._count?.results || 0} subs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-500">{new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <button onClick={() => setViewId(a.id)} className="p-2 rounded-lg bg-dark-600/40 border border-dark-500/15 hover:bg-dark-500/40 transition-all">
                  <Eye className="w-4 h-4 text-dark-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && !showCreate && (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <FileText className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No assessments in your departments yet.</p>
        </div>
      )}
    </div>
  )
}

function CreateForm({ subjects, onClose }) {
  const [form, setForm] = useState({ title: '', type: 'mcq', subjectId: '', dueDate: '' })
  const [questions, setQuestions] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const addQ = () => setQuestions(p => [...p, { question: '', options: ['', '', '', ''], answer: '' }])
  const updateQ = (i, f, v) => setQuestions(p => p.map((q, idx) => idx === i ? { ...q, [f]: v } : q))
  const updateOpt = (qi, oi, v) => setQuestions(p => p.map((q, i) => { if (i !== qi) return q; const o = [...q.options]; o[oi] = v; return { ...q, options: o } }))
  const removeQ = (i) => setQuestions(p => p.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!form.title || !form.subjectId || !form.dueDate) return; setSubmitting(true)
    try {
      const body = { ...form, questions: questions.length > 0 ? questions.map(q => ({ question: q.question, options: q.options.filter(o => o.trim()), answer: q.answer })) : undefined }
      const resp = await api.post('/assessments/create', body)
      if (resp.data.success) { invalidateCache('/assessments'); onClose() }
    } catch (err) { console.error(err) } finally { setSubmitting(false) }
  }

  // Group subjects by department
  const deptMap = {}
  ;(subjects || []).forEach(s => {
    const dName = s.department?.name || 'General'
    if (!deptMap[dName]) deptMap[dName] = []
    deptMap[dName].push(s)
  })

  return (
    <form onSubmit={handleSubmit} className="bg-dark-700/60 border border-brand-500/20 rounded-2xl p-6 space-y-5">
      <h3 className="font-semibold font-heading text-lg">Create Assessment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Department Quiz"
            className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50" />
        </div>
        <div>
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm appearance-none select-styled">
            <option value="mcq">MCQ</option><option value="descriptive">Descriptive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Subject * (from managed depts)</label>
          <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm appearance-none select-styled">
            <option value="">Select subject...</option>
            {Object.entries(deptMap).map(([dept, subs]) => (
              <optgroup key={dept} label={dept}>
                {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-dark-400 font-medium mb-1.5">Due Date *</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm" />
        </div>
      </div>

      {form.type === 'mcq' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-dark-200">Questions ({questions.length})</h4>
            <button type="button" onClick={addQ} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="p-4 rounded-xl bg-dark-800/40 border border-dark-500/15 space-y-3">
              <div className="flex justify-between"><span className="text-xs text-dark-500 font-mono">Q{qi + 1}</span><button type="button" onClick={() => removeQ(qi)} className="text-danger/60 hover:text-danger"><Trash2 className="w-4 h-4" /></button></div>
              <input value={q.question} onChange={e => updateQ(qi, 'question', e.target.value)} placeholder="Question..."
                className="w-full px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-500/15 text-dark-100 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((o, oi) => <input key={oi} value={o} onChange={e => updateOpt(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  className="w-full px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-500/15 text-dark-100 text-sm" />)}
              </div>
              <select value={q.answer} onChange={e => updateQ(qi, 'answer', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-500/15 text-dark-100 text-sm appearance-none select-styled">
                <option value="">Correct answer...</option>
                {q.options.map((o, oi) => o.trim() && <option key={oi} value={o}>{String.fromCharCode(65 + oi)}. {o}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-dark-600/40 border border-dark-500/20 text-dark-300 text-sm font-medium">Cancel</button>
        <button type="submit" disabled={submitting || !form.title || !form.subjectId || !form.dueDate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm disabled:opacity-40 transition-all">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  )
}

function DetailView({ assessmentId, onClose }) {
  const { data } = useAPI(`/assessments/detail/${assessmentId}`, { fallback: null })
  if (!data) return null
  return (
    <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 space-y-4">
      <div className="flex justify-between"><div><h3 className="font-semibold text-lg">{data.title}</h3><p className="text-xs text-dark-400">{data.subject?.department?.name} · {data.subject?.name}</p></div><button onClick={onClose} className="text-xs text-dark-400 hover:text-dark-200">Close</button></div>
      <div className="flex gap-4 text-sm">
        <span>Questions: <strong>{data.questions?.length || 0}</strong></span>
        <span>Submissions: <strong>{data.stats?.total || 0}</strong></span>
        <span>Avg: <strong className="text-brand-300">{data.stats?.average || 0}%</strong></span>
      </div>
      {(data.results || []).length > 0 && data.results.map((r, i) => (
        <div key={r.student.id} className="flex justify-between px-4 py-2.5 rounded-lg bg-dark-800/30 border border-dark-500/10">
          <span className="text-sm">{i + 1}. {r.student.name}</span>
          <span className={`font-bold ${r.score >= 70 ? 'text-success' : r.score >= 40 ? 'text-amber-400' : 'text-danger'}`}>{r.score}%</span>
        </div>
      ))}
    </div>
  )
}
