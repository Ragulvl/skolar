import { useState } from 'react'
import { Plus, FileText, ClipboardList, Trash2, Loader2 } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

export default function SchoolTeacherAssessments() {
  const { data: assignData } = useAPI('/attendance/my-assignments', { fallback: {} })
  const assignments = assignData?.assignments || []
  const { data: assessments, loading, refetch } = useAPI('/assessments/my', { fallback: [] })

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'mcq', subjectId: '', dueDate: '', questions: [] })

  const addQuestion = () => {
    setForm(p => ({
      ...p,
      questions: [...p.questions, { question: '', options: ['', '', '', ''], answer: '0' }]
    }))
  }
  const updateQuestion = (idx, field, value) => {
    setForm(p => {
      const q = [...p.questions]; q[idx] = { ...q[idx], [field]: value }; return { ...p, questions: q }
    })
  }
  const updateOption = (qIdx, oIdx, value) => {
    setForm(p => {
      const q = [...p.questions]; const opts = [...q[qIdx].options]; opts[oIdx] = value
      q[qIdx] = { ...q[qIdx], options: opts }; return { ...p, questions: q }
    })
  }
  const removeQuestion = (idx) => setForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }))

  const handleCreate = async () => {
    if (!form.title || !form.subjectId || !form.dueDate || form.questions.length === 0) return
    setSubmitting(true)
    try {
      await api.post('/assessments/create', form)
      setShowForm(false)
      setForm({ title: '', type: 'mcq', subjectId: '', dueDate: '', questions: [] })
      invalidateCache('/assessments')
      refetch()
    } catch (err) { alert(err.response?.data?.error || 'Failed to create') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
          <p className="text-sm text-dark-200 mt-1.5">Create and manage assessments for your classes.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium flex items-center gap-2 hover:shadow-glow transition-all">
          <Plus className="w-4 h-4" /> Create Assessment
        </button>
      </div>

      {showForm && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold font-heading">New Assessment</h3>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Assessment Title" className="input-base" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50 appearance-none select-styled">
              <option value="mcq">MCQ</option>
              <option value="descriptive">Descriptive</option>
            </select>
            <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50 appearance-none select-styled">
              <option value="">Select subject...</option>
              {assignments.map(a => <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-800/60 border border-dark-500/25 text-dark-100 text-sm focus:outline-none focus:border-brand-500/50" />
          </div>

          {form.questions.map((q, qIdx) => (
            <div key={qIdx} className="p-4 rounded-xl bg-dark-800/40 border border-dark-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-dark-400">Question {qIdx + 1}</span>
                <button onClick={() => removeQuestion(qIdx)} className="text-dark-500 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              <input value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} placeholder="Enter question..."
                className="w-full px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-500/15 text-dark-100 text-sm" />
              {form.type === 'mcq' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <input key={oIdx} value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="px-3 py-2 rounded-lg bg-dark-700/30 border border-dark-500/10 text-dark-100 text-sm" />
                    ))}
                  </div>
                  <select value={q.answer} onChange={e => updateQuestion(qIdx, 'answer', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-700/40 border border-dark-500/15 text-dark-100 text-sm appearance-none select-styled">
                    {q.options.map((_, i) => <option key={i} value={i.toString()}>Correct: Option {String.fromCharCode(65 + i)}</option>)}
                  </select>
                </>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button onClick={addQuestion} className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Question
            </button>
            <button onClick={handleCreate} disabled={submitting}
              className="px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </div>
      )}

      {(assessments || []).length > 0 ? (
        <div className="space-y-3">
          {assessments.map(a => (
            <div key={a.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.type === 'mcq' ? 'bg-brand-500/12' : 'bg-violet-500/12'}`}>
                    {a.type === 'mcq' ? <ClipboardList className="w-5 h-5 text-brand-400" /> : <FileText className="w-5 h-5 text-violet-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-50">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.subject?.name || '—'} · {a.questions?.length || 0} questions</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={a.type === 'mcq' ? 'brand' : 'violet'} size="sm">{a.type?.toUpperCase()}</Badge>
                  <p className="text-xs text-dark-500 mt-1">Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <FileText className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">{loading ? 'Loading...' : 'No assessments yet. Create one!'}</p>
        </div>
      )}
    </div>
  )
}
