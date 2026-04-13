import { Building2, Users, GraduationCap, ClipboardCheck, BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeDeanOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/dean/overview', { fallback: {} })
  const stats = data.stats || {}
  const departments = data.departments || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Dean Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{user?.institution?.name || 'Your departments at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Departments" value={loading ? '—' : (stats.departments || 0).toString()} />
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (stats.teachers || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (stats.students || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance" value={loading ? '—' : `${stats.attendance || 0}%`} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/college/dean/departments"
          className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-semibold text-brand-400">Departments</span>
          </div>
          <p className="text-xs text-dark-400">View and manage departments</p>
        </Link>
        <Link to="/dashboard/college/dean/staff"
          className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-violet-400">Staff</span>
          </div>
          <p className="text-xs text-dark-400">View staff across departments</p>
        </Link>
        <Link to="/dashboard/college/dean/attendance"
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Attendance</span>
          </div>
          <p className="text-xs text-dark-400">Monitor attendance records</p>
        </Link>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">My Departments</h3>
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {departments.map(dept => (
              <Link key={dept.id} to="/dashboard/college/dean/departments"
                className="p-4 rounded-xl bg-dark-800/40 border border-dark-500/15 hover:border-brand-500/30 hover:bg-dark-700/60 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                      <BookOpen className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-50 text-sm group-hover:text-brand-300 transition-colors">{dept.name}</h4>
                      <p className="text-xs text-dark-400">HOD: {dept.hodName || '—'}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-300">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {dept.teachers} Teachers</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {dept.subjects} Subjects</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-8">No departments assigned to you.</p>
        )}
      </div>
    </div>
  )
}

