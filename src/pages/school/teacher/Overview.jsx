import { BookOpen, Users, ClipboardCheck, FileText, Clock } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolTeacherOverview() {
  const { user } = useAuth()

  const { data: allTeachers } = useAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  const myClasses = (allTeachers || []).filter(t => t.id === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Teacher Dashboard</h1>
        <p className="text-sm text-dark-200 mt-1.5">Welcome back, {user?.name?.split(' ')[0] || 'Teacher'} 👋</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Subjects" value={myClasses.length.toString()} />
        <StatCard icon={Users} label="Total Students" value="—" />
        <StatCard icon={ClipboardCheck} label="Today's Attendance" value="—" />
        <StatCard icon={FileText} label="Active Assessments" value="—" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Classes', icon: BookOpen, path: '/dashboard/school/teacher' },
          { label: 'Mark Attendance', icon: ClipboardCheck, path: '/dashboard/school/teacher/attendance' },
          { label: 'Assessments', icon: FileText, path: '/dashboard/school/teacher/assessments' },
          { label: 'My Students', icon: Users, path: '/dashboard/school/teacher/students' },
        ].map(action => (
          <a key={action.label} href={action.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
              bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
            <action.icon className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
            <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">{action.label}</span>
          </a>
        ))}
      </div>

      {/* My Classes Summary */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">My Classes</h3>
        {myClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClasses.map((cls, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800/40 border border-dark-500/15 card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/12 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-50 text-sm">{cls.subject}</p>
                    <p className="text-xs text-dark-400">Grade {cls.grade} · Section {cls.section}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-6">No classes assigned yet.</p>
        )}
      </div>
    </div>
  )
}
