import { BarChart3 } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentGrades() {
  const { data, loading } = useAPI('/student/grades', { fallback: [] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Grades</h1>
        <p className="text-sm text-dark-200 mt-1.5">Per-subject performance summary.</p>
      </div>

      {(data || []).length > 0 ? (
        <div className="space-y-4">
          {data.map(g => (
            <div key={g.subjectId} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-dark-50">{g.subjectName}</p>
                <span className={`text-lg font-bold ${g.avgScore >= 70 ? 'text-success' : g.avgScore >= 40 ? 'text-amber-400' : 'text-danger'}`}>
                  {g.avgScore}%
                </span>
              </div>
              <div className="w-full bg-dark-600/40 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full transition-all ${
                  g.avgScore >= 70 ? 'bg-success' : g.avgScore >= 40 ? 'bg-amber-400' : 'bg-danger'
                }`} style={{ width: `${Math.min(g.avgScore, 100)}%` }} />
              </div>
              <div className="flex gap-4 text-xs text-dark-400">
                <span>Tests: {g.testsCount}</span>
                <span>Highest: {g.highest}%</span>
                <span>Lowest: {g.lowest}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <BarChart3 className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No graded assessments yet.</p>
        </div>
      )}
    </div>
  )
}
