import { useState } from 'react'
import { FileText, Clock, Check, ChevronRight } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function SchoolStudentAssessments() {
  const { user } = useAuth()
  const { data: results, loading } = useAPI(
    user?.id ? `/assessments/results/${user.id}` : null,
    { fallback: [] }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">View your assessments and results.</p>
      </div>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map(r => (
            <div key={r.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-50">{r.assessment?.title}</p>
                    <p className="text-xs text-dark-400">{r.assessment?.subject?.name || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-heading text-dark-50">{Math.round(r.score)}</p>
                  <p className="text-xs text-dark-400">Score</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title={loading ? 'Loading...' : 'No assessments yet'}
          message="Your assessments and results will appear here." />
      )}
    </div>
  )
}
