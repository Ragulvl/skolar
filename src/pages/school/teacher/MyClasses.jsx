import { BookOpen, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolTeacherClasses() {
  const { user } = useAuth()

  const { data: allTeachers } = useAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  // Filter to only show current teacher's classes
  const classes = (allTeachers || []).filter(t => t.id === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Classes</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your assigned classes and subjects.</p>
      </div>
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map(cls => (
            <Link key={cls.id} to={`/dashboard/school/teacher/classes/${cls.id}`}
              className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 hover:border-brand-500/30 hover:bg-dark-700/80 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-dark-50 group-hover:text-brand-300 transition-colors">{cls.subject}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="brand" size="sm">Grade {cls.grade}</Badge>
                <Badge variant="neutral" size="sm">Section {cls.section}</Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-sm text-dark-300">
                <Users className="w-4 h-4" /> {cls.students || 0} students
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-dark-400">No classes assigned yet.</div>
      )}
    </div>
  )
}

