import { FileText, ClipboardList } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolPrincipalAssessments() {
  const { user } = useAuth()
  const { data: report, loading } = useAPI(
    user?.institutionId ? `/admin/reports/${user.institutionId}` : null,
    { fallback: {} }
  )
  const { data: allAssessments, loading: loadingAssessments } = useAPI('/assessments/my-assessments', { fallback: [] })

  const assess = report?.assessments || {}
  const assessments = allAssessments || []

  // Build chart data for per-subject average
  const subjectScores = report?.subjectPerformance || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessment Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Performance overview across subjects.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
          <p className="text-xs text-dark-400 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-dark-50">{loading ? '—' : `${assess.avgScore || 0}/100`}</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
          <p className="text-xs text-dark-400 mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-dark-50">{loading ? '—' : (assess.totalResults || 0)}</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
          <p className="text-xs text-dark-400 mb-1">Assessments</p>
          <p className="text-2xl font-bold text-dark-50">{loadingAssessments ? '—' : assessments.length}</p>
        </div>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-1">Subject-wise Average Scores</h3>
        <p className="text-xs text-dark-400 mb-4">Across all grades</p>
        {subjectScores.length > 0 ? (
          <PerformanceBar data={subjectScores} height={350} />
        ) : (
          <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">
            {loading ? 'Loading...' : 'No assessment data yet'}
          </div>
        )}
      </div>

      {assessments.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Recent Assessments</h3>
          <div className="space-y-3">
            {assessments.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.type === 'mcq' ? 'bg-brand-500/12' : 'bg-violet-500/12'}`}>
                    {a.type === 'mcq' ? <ClipboardList className="w-4 h-4 text-brand-400" /> : <FileText className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-50">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.subject?.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.type === 'mcq' ? 'brand' : 'violet'} size="sm">{a.type?.toUpperCase()}</Badge>
                  <span className="text-xs text-dark-500">
                    {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
