import { useState } from 'react'
import { FileText, Eye, Building2 } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function AssessmentsPage() {
  const { data: assessments, loading } = useAPI('/college-admin/assessments', { fallback: [] })
  const [viewId, setViewId] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">All assessments across the institution.</p>
      </div>

      {viewId && <DetailView assessmentId={viewId} onClose={() => setViewId(null)} />}

      {(assessments || []).length > 0 ? (
        <div className="space-y-3">
          {assessments.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/60 border border-dark-500/25 hover:border-dark-400/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/12 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-dark-50 text-sm">{a.title}</p>
                  <p className="text-xs text-dark-400">
                    <Building2 className="w-3 h-3 inline mr-1" />
                    {a.subject?.department?.name || a.subject?.name || '—'} · {a.type} · {a._count?.questions || 0}Q · {a._count?.results || 0} submissions · by {a.creator?.name || '—'}
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
      ) : !loading && (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <FileText className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No assessments found across the institution.</p>
        </div>
      )}
    </div>
  )
}

function DetailView({ assessmentId, onClose }) {
  const { data } = useAPI(`/assessments/detail/${assessmentId}`, { fallback: null })
  if (!data) return null
  return (
    <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold font-heading text-lg">{data.title}</h3>
          <p className="text-xs text-dark-400">{data.subject?.department?.name} · {data.subject?.name} · {data.type}</p>
        </div>
        <button onClick={onClose} className="text-xs text-dark-400 hover:text-dark-200">Close ✕</button>
      </div>
      <div className="flex gap-4 text-sm">
        <span className="text-dark-300">Questions: <strong className="text-dark-100">{data.questions?.length || 0}</strong></span>
        <span className="text-dark-300">Submissions: <strong className="text-dark-100">{data.stats?.total || 0}</strong></span>
        <span className="text-dark-300">Avg: <strong className="text-brand-300">{data.stats?.average || 0}%</strong></span>
      </div>
      {(data.results || []).length > 0 && (
        <div className="space-y-2">
          {data.results.map((r, i) => (
            <div key={r.student.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-dark-800/30 border border-dark-500/10">
              <div className="flex items-center gap-3">
                <span className="text-xs text-dark-500 w-5">{i + 1}</span>
                <span className="text-sm text-dark-100">{r.student.name}</span>
              </div>
              <span className={`text-sm font-bold ${r.score >= 70 ? 'text-success' : r.score >= 40 ? 'text-amber-400' : 'text-danger'}`}>{r.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
