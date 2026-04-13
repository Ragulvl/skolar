import { BookOpen } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentSubjects() {
  const { data, loading } = useAPI('/student/subjects', { fallback: [] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Subjects</h1>
        <p className="text-sm text-dark-200 mt-1.5">Subjects in your department.</p>
      </div>

      {(data || []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(s => (
            <div key={s.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/12 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                </div>
                <p className="font-semibold text-dark-50">{s.name}</p>
              </div>
              <p className="text-xs text-dark-400">
                {s.teachers?.length > 0 ? `Taught by: ${s.teachers.join(', ')}` : 'No teacher assigned'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <BookOpen className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No subjects available.</p>
        </div>
      )}
    </div>
  )
}
