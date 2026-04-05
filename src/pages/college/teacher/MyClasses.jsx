import { BookOpen, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeTeacherClasses() {
  const { user } = useAuth()

  const { data: allTeachers } = useAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  const classes = (allTeachers || []).filter(t => t.id === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Classes</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your assigned subjects and classes.</p>
      </div>
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map(cls => (
            <div key={cls.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 card-hover">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-dark-50">{cls.subject}</h3>
              <p className="text-sm text-dark-200 mt-1.5">{cls.department || '—'}</p>
              <div className="flex items-center gap-1.5 mt-3 text-sm text-dark-300">
                <Users className="w-4 h-4" /> {cls.students || 0} students
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-dark-400">No classes assigned yet.</div>
      )}
    </div>
  )
}
