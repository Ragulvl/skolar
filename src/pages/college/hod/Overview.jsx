import { BookOpen, Users, GraduationCap, FileText, ClipboardCheck, ArrowRight, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeHODOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/hod/overview', { fallback: {} })

  const quickLinks = [
    { to: '/dashboard/college/hod/teachers', icon: UserCog, label: 'Manage Teachers', desc: 'View and manage department teachers' },
    { to: '/dashboard/college/hod/subjects', icon: BookOpen, label: 'Manage Subjects', desc: 'Create subjects and assign teachers' },
    { to: '/dashboard/college/hod/attendance', icon: ClipboardCheck, label: 'View Attendance', desc: 'Monitor department attendance' },
    { to: '/dashboard/college/hod/assessments', icon: FileText, label: 'Assessments', desc: 'Create and manage assessments' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Department Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{data?.departmentName || user?.institution?.name || 'Your department at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (data.teachers || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (data.students || 0).toString()} />
        <StatCard icon={BookOpen} label="Subjects" value={loading ? '—' : (data.subjects || 0).toString()} />
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : (data.assessments || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance" value={loading ? '—' : `${data.attendance || 0}%`} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to}
            className="p-4 rounded-2xl bg-dark-700/60 border border-dark-500/25 hover:border-brand-500/30 hover:bg-dark-700/80 transition-all group card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                <link.icon className="w-5 h-5 text-brand-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-semibold text-dark-50 group-hover:text-brand-300 transition-colors">{link.label}</h3>
            <p className="text-xs text-dark-400 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Subject summary */}
      {(data?.subjectList || []).length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-heading">Subjects & Assignments</h3>
            <Link to="/dashboard/college/hod/subjects" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.subjectList.map(s => (
              <div key={s.id} className="p-3 rounded-xl bg-dark-800/40 border border-dark-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-dark-50">{s.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(s.teachers || []).length > 0 ? s.teachers.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300">{t}</span>
                  )) : (
                    <span className="text-[11px] text-amber-400 italic">⚠ No teacher assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned teachers warning */}
      {(data?.unassignedTeachers || 0) > 0 && (
        <Link to="/dashboard/college/hod/teachers"
          className="block p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">
              {data.unassignedTeachers} teacher{data.unassignedTeachers > 1 ? 's' : ''} without subject assignments
            </span>
          </div>
        </Link>
      )}
    </div>
  )
}
