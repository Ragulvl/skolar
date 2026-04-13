import { Layers, Users, GraduationCap, ClipboardCheck, BarChart3, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolVPOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/viceprincipal/overview', { fallback: {} })
  const { data: grades } = useAPI('/viceprincipal/grades', { fallback: [] })
  const basePath = '/dashboard/school/vice-principal'

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-500/10 via-violet-500/10 to-transparent border border-dark-500/25 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold font-heading">Vice Principal Overview</h1>
        <p className="text-sm text-dark-300 mt-2">{user?.institution?.name || 'Your assigned grades at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Assigned Grades" value={loading ? '—' : (data.grades || 0).toString()} />
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (data.teachers || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (data.students || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance %" value={loading ? '—' : `${data.attendance || 0}%`} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={`${basePath}/grades`}
          className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-semibold text-brand-400">My Grades</span>
          </div>
          <p className="text-xs text-dark-400">View grades and sections</p>
        </Link>
        <Link to={`${basePath}/teachers`}
          className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-violet-400">View Teachers</span>
          </div>
          <p className="text-xs text-dark-400">Teachers in your grades</p>
        </Link>
        <Link to={`${basePath}/attendance`}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Attendance</span>
          </div>
          <p className="text-xs text-dark-400">View attendance reports</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Attendance Summary</h3>
          <div className="max-w-xs mx-auto">
            <AttendanceDonut present={parseInt(data.attendance || 0)} absent={100 - parseInt(data.attendance || 0)} late={0} />
          </div>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Assigned Grades</h3>
          {(grades || []).length > 0 ? (
            <div className="space-y-3">
              {grades.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/12 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-50">Grade {g.name}</p>
                      <p className="text-xs text-dark-400">{g.sections?.length || 0} sections</p>
                    </div>
                  </div>
                  <span className="text-sm text-dark-300">
                    {g.sections?.reduce((sum, s) => sum + (s._count?.users || 0), 0) || 0} students
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-dark-400">
              {loading ? 'Loading...' : 'No grades assigned yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
