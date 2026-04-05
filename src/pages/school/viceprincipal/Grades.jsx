import { Layers } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function SchoolVPGrades() {
  const { data: grades, loading } = useAPI('/viceprincipal/grades', { fallback: [] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Grades</h1>
        <p className="text-sm text-dark-200 mt-1.5">Grades assigned to you for oversight.</p>
      </div>

      {grades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {grades.map(grade => (
            <div key={grade.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-500/12 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-heading text-dark-50">Grade {grade.name}</h3>
                  <p className="text-xs text-dark-400">{grade.sections?.length || 0} sections</p>
                </div>
              </div>
              {grade.sections?.length > 0 && (
                <div className="space-y-2">
                  {grade.sections.map(sec => (
                    <div key={sec.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-800/40">
                      <span className="text-sm text-dark-200">Section {sec.name}</span>
                      <span className="text-xs text-dark-400">{sec._count?.users || 0} students</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Layers} title={loading ? 'Loading...' : 'No grades assigned'}
          message="Contact your principal to get grades assigned to your account." />
      )}
    </div>
  )
}
