import { useState } from 'react'
import { FileText, Clock, CheckCircle2, ArrowRight, Loader2, ChevronLeft } from 'lucide-react'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

export default function SchoolStudentAssessments() {
  const { data, loading } = useAPI('/assessments/pending', { fallback: {} })
  const [takeId, setTakeId] = useState(null)

  const pending = data?.pending || []
  const completed = data?.completed || []

  if (takeId) return <TakeAssessment assessmentId={takeId} onBack={() => { setTakeId(null); invalidateCache('/assessments/pending') }} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">Take pending assessments and view your results.</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" /> Pending ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/60 border border-amber-500/15 hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/12 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-50 text-sm">{a.title}</p>
                    <p className="text-xs text-dark-400">
                      {a.subjectName} · {a.type.toUpperCase()} · {a.questionsCount} questions · by {a.creatorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dark-500">
                    Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <button onClick={() => setTakeId(a.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/20 transition-all">
                    Take <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-8 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-success/40 mx-auto mb-2" />
            <p className="text-sm text-dark-400">All caught up! No pending assessments.</p>
          </div>
        )}
      </div>

      {/* Completed */}
      <div>
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" /> Completed ({completed.length})
        </h2>
        {completed.length > 0 ? (
          <div className="space-y-3">
            {completed.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/60 border border-dark-500/25">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/12 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-50 text-sm">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.subjectName} · {a.questionsCount} questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dark-500">
                    {new Date(a.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-lg font-bold ${a.score >= 70 ? 'text-success' : a.score >= 40 ? 'text-amber-400' : 'text-danger'}`}>
                    {a.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-8 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
            <p className="text-sm text-dark-400">No completed assessments yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TakeAssessment({ assessmentId, onBack }) {
  const { data: assessment, loading } = useAPI(`/assessments/take/${assessmentId}`, { fallback: null })
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  if (loading) return (
    <div className="text-center py-16"><Loader2 className="w-10 h-10 text-brand-400 mx-auto animate-spin" /><p className="text-sm text-dark-400 mt-3">Loading assessment...</p></div>
  )
  if (!assessment) return (
    <div className="text-center py-16">
      <p className="text-sm text-dark-400">Assessment not available or already submitted.</p>
      <button onClick={onBack} className="mt-4 text-brand-400 text-sm hover:underline">← Go Back</button>
    </div>
  )

  const questions = assessment.questions || []
  const answeredCount = Object.keys(answers).length

  const handleSubmit = async () => {
    if (submitting) return; setSubmitting(true)
    try {
      const resp = await api.post('/assessments/submit', { assessmentId, answers })
      if (resp.data.success) {
        setResult(resp.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${result.score >= 70 ? 'bg-success/12' : result.score >= 40 ? 'bg-amber-500/12' : 'bg-danger/12'}`}>
          <span className={`text-3xl font-bold ${result.score >= 70 ? 'text-success' : result.score >= 40 ? 'text-amber-400' : 'text-danger'}`}>{result.score}%</span>
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading">Assessment Complete!</h2>
          <p className="text-sm text-dark-400 mt-1">You got {result.correct} out of {result.total} correct</p>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all duration-1000 ${result.score >= 70 ? 'bg-success' : result.score >= 40 ? 'bg-amber-500' : 'bg-danger'}`}
            style={{ width: `${result.score}%` }} />
        </div>
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm hover:shadow-lg transition-all">
          ← Back to Assessments
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 transition-all">
          <ChevronLeft className="w-4 h-4 text-dark-300" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold font-heading">{assessment.title}</h1>
          <p className="text-xs text-dark-400">{assessment.subject?.name} · {questions.length} questions</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/5 border border-brand-500/15">
        <span className="text-xs text-dark-300">Progress:</span>
        <div className="flex-1 bg-dark-700 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-dark-400 font-mono">{answeredCount}/{questions.length}</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const opts = Array.isArray(q.options) ? q.options : []
          return (
            <div key={q.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-500/12 flex items-center justify-center text-xs font-bold text-brand-300">{idx + 1}</span>
                <p className="text-sm text-dark-100 font-medium leading-relaxed">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
                {opts.map((opt, oIdx) => {
                  const isSelected = answers[q.id] === opt
                  return (
                    <button key={oIdx} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500/40 text-brand-200 ring-1 ring-brand-500/30'
                          : 'bg-dark-800/30 border-dark-500/15 text-dark-300 hover:border-dark-400/25 hover:bg-dark-800/50'
                      }`}>
                      <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + oIdx)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSubmit} disabled={answeredCount < questions.length || submitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-brand-500/25 transition-all">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {submitting ? 'Submitting...' : `Submit Assessment (${answeredCount}/${questions.length})`}
        </button>
      </div>
    </div>
  )
}
