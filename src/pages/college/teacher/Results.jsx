import { BarChart3, FileText, Users, TrendingUp, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherResults() {
  const { data: assessments, loading } = useAPI('/assessments/my', { fallback: [] })
  const [expanded, setExpanded] = useState(null)

  // Get details for expanded assessment
  const { data: detail } = useAPI(
    expanded ? `/assessments/${expanded}/results` : null,
    { fallback: {} }
  )

  // Calculate overall stats
  const totalAssessments = assessments.length
  const withResults = assessments.filter(a => (a._count?.results || a.resultsCount || 0) > 0)
  const totalSubmissions = assessments.reduce((sum, a) => sum + (a._count?.results || a.resultsCount || 0), 0)

  const toggleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Results</h1>
        <p className="text-sm text-dark-200 mt-1.5">View assessment results for your created assessments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : totalAssessments.toString()} />
        <StatCard icon={Users} label="Total Submissions" value={loading ? '—' : totalSubmissions.toString()} />
        <StatCard icon={TrendingUp} label="With Results" value={loading ? '—' : withResults.length.toString()} />
      </div>

      {assessments.length > 0 ? (
        <div className="space-y-3">
          {assessments.map(a => {
            const resultCount = a._count?.results || a.resultsCount || 0
            const isExpanded = expanded === a.id

            return (
              <div key={a.id} className="rounded-2xl bg-dark-700/60 border border-dark-500/25 overflow-hidden transition-all">
                {/* Assessment header */}
                <button
                  onClick={() => resultCount > 0 && toggleExpand(a.id)}
                  className={`w-full p-4 flex items-center justify-between text-left transition-all
                    ${resultCount > 0 ? 'hover:bg-dark-600/40 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-50">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-dark-400">{a.subject?.name || a.subjectName || '—'}</span>
                        <Badge variant="brand" size="sm">{a.type}</Badge>
                        <span className="text-xs text-dark-500">
                          {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-dark-100">{resultCount}</p>
                      <p className="text-xs text-dark-400">submissions</p>
                    </div>
                    {resultCount > 0 && (
                      isExpanded
                        ? <ChevronUp className="w-4 h-4 text-dark-400" />
                        : <ChevronDown className="w-4 h-4 text-dark-400" />
                    )}
                  </div>
                </button>

                {/* Expanded results */}
                {isExpanded && detail?.results && (
                  <div className="border-t border-dark-500/20 p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-500/20">
                            <th className="text-left py-2 px-3 text-dark-400 font-medium text-xs">Student</th>
                            <th className="text-center py-2 px-3 text-dark-400 font-medium text-xs">Score</th>
                            <th className="text-right py-2 px-3 text-dark-400 font-medium text-xs">Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.results.map(r => (
                            <tr key={r.id} className="border-b border-dark-500/10 hover:bg-dark-600/20 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/12 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                                    {r.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <span className="text-dark-100">{r.student?.name}</span>
                                </div>
                              </td>
                              <td className="text-center py-2.5 px-3">
                                <span className={`text-sm font-bold ${
                                  r.score >= 80 ? 'text-success' : r.score >= 50 ? 'text-amber-400' : 'text-danger'
                                }`}>{r.score}</span>
                              </td>
                              <td className="text-right py-2.5 px-3 text-xs text-dark-400">
                                {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {detail.avgScore !== undefined && (
                      <div className="mt-3 pt-3 border-t border-dark-500/15 flex items-center gap-4 text-xs text-dark-300">
                        <span>Average: <strong className="text-dark-100">{Math.round(detail.avgScore)}</strong></span>
                        <span>Highest: <strong className="text-success">{detail.highest}</strong></span>
                        <span>Lowest: <strong className="text-danger">{detail.lowest}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={BarChart3}
          title={loading ? 'Loading...' : 'No assessments yet'}
          message="Results will appear here once you create assessments."
        />
      )}
    </div>
  )
}
