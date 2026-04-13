import { BookOpen, User } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function SchoolStudentSubjects() {
  const { data, loading } = useAPI('/student/subjects', { fallback: [] })
  const subjects = data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Subjects</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your enrolled subjects and teachers.</p>
      </div>
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map(sub => (
            <div key={sub.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-dark-50">{sub.name}</h3>
              <p className="text-sm text-dark-200 mt-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {sub.teachers?.length > 0 ? sub.teachers.join(', ') : '—'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <BookOpen className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">{loading ? 'Loading...' : 'No subjects enrolled yet.'}</p>
        </div>
      )}
    </div>
  )
}
