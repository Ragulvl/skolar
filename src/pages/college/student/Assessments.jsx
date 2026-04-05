import { FileText } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentAssessments() {
  const { data, loading } = useAPI('/student/assessments', { fallback: [] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your test results and submissions.</p>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        {(data || []).length > 0 ? (
          <div className="space-y-3">
            {data.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/12 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-50 text-sm">{r.assessmentTitle}</p>
                    <p className="text-xs text-dark-400">{r.subjectName} · {r.assessmentType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${r.score >= 70 ? 'text-success' : r.score >= 40 ? 'text-amber-400' : 'text-danger'}`}>
                    {r.score}%
                  </p>
                  <p className="text-[10px] text-dark-500">
                    {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-dark-500 mx-auto mb-3" />
            <p className="text-sm text-dark-400">No assessment results yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
