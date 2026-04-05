import { BookOpen, ClipboardCheck, FileText, Award } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/student/dashboard', { fallback: {} })

  const att = data?.attendance || {}
  const assess = data?.assessments || {}
  const subjects = data?.subjects || []

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500/10 via-brand-500/10 to-transparent border border-dark-500/25 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold font-heading">Hi {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
        <p className="text-sm text-dark-300 mt-2">{user?.institution?.name || '—'}{user?.department?.name ? ` · ${user.department.name}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Attendance Rate" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={FileText} label="Tests Taken" value={loading ? '—' : assess.totalTaken?.toString() || '0'} />
        <StatCard icon={FileText} label="Avg Score" value={loading ? '—' : assess.avgScore?.toString() || '0'} />
        <StatCard icon={Award} label="Certificates" value={loading ? '—' : (data?.certificates || 0).toString()} />
      </div>

      {/* My Subjects */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">My Subjects ({subjects.length})</h3>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(s => (
              <div key={s.id} className="p-4 rounded-xl bg-dark-800/40 border border-dark-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/12 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-50 text-sm">{s.name}</p>
                    <p className="text-xs text-dark-400">{s.teachers?.join(', ') || 'No teacher assigned'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-dark-500 mx-auto mb-3" />
            <p className="text-sm text-dark-400">No subjects in your department yet.</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Attendance Breakdown</h3>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{att.present || 0}</p>
            <p className="text-xs text-dark-400">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-danger">{att.absent || 0}</p>
            <p className="text-xs text-dark-400">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{att.late || 0}</p>
            <p className="text-xs text-dark-400">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-dark-200">{att.total || 0}</p>
            <p className="text-xs text-dark-400">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}
