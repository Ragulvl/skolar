import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, GraduationCap, School, Activity,
  AlertTriangle, ChevronRight, UserCheck, ClipboardList,
  FileText, Clock, Shield
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { useMultiAPI } from '../../hooks/useAPI'

export default function SuperAdminOverview() {
  const navigate = useNavigate()

  const { data, loading } = useMultiAPI([
    { url: '/superadmin/stats', key: 'stats', staleTime: 60_000 },
    { url: '/superadmin/institutions?limit=5', key: 'recentInstitutions', staleTime: 60_000, fallback: [] },
    { url: '/superadmin/activity', key: 'activity', staleTime: 30_000, fallback: [] },
  ])

  const stats = data.stats
  const recentInstitutions = data.recentInstitutions || []
  const activity = data.activity || []

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const activityIcon = (type) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4 text-blue-400" />
      case 'user_approved': return <UserCheck className="w-4 h-4 text-success" />
      case 'institution_created': return <Building2 className="w-4 h-4 text-brand-400" />
      default: return <Activity className="w-4 h-4 text-dark-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Platform Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your command center for the entire Skolar platform.</p>
      </div>

      {/* Pending Alert */}
      {stats?.pending > 0 && (
        <button
          onClick={() => navigate('/dashboard/superadmin/pending')}
          className="w-full bg-orange-500/10 border border-orange-500/25 rounded-2xl p-4
            flex items-center gap-4 hover:bg-orange-500/15 transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-300">
              {stats.pending} user{stats.pending > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-dark-400 mt-0.5">Review and assign roles to new signups.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Institutions" value={loading ? '—' : (stats?.total || 0).toString()} />
        <StatCard icon={Users} label="Total Users" value={loading ? '—' : (stats?.users || 0).toLocaleString()} />
        <StatCard icon={School} label="Schools" value={loading ? '—' : (stats?.schools || 0).toString()} />
        <StatCard icon={GraduationCap} label="Colleges" value={loading ? '—' : (stats?.colleges || 0).toString()} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mx-auto mb-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-heading text-dark-50">{loading ? '—' : stats?.teachers || 0}</p>
          <p className="text-xs text-dark-400 mt-0.5">Teachers</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold font-heading text-dark-50">{loading ? '—' : stats?.students || 0}</p>
          <p className="text-xs text-dark-400 mt-0.5">Students</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-xl font-bold font-heading text-dark-50">{loading ? '—' : stats?.assessments || 0}</p>
          <p className="text-xs text-dark-400 mt-0.5">Assessments</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center mx-auto mb-2">
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-heading text-dark-50">{loading ? '—' : stats?.attendance || 0}</p>
          <p className="text-xs text-dark-400 mt-0.5">Attendance</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add School', icon: School, path: '/dashboard/superadmin/schools', color: 'brand' },
          { label: 'Add College', icon: GraduationCap, path: '/dashboard/superadmin/colleges', color: 'violet' },
          { label: 'Manage Users', icon: Users, path: '/dashboard/superadmin/users', color: 'emerald' },
          { label: 'Manage Admins', icon: Shield, path: '/dashboard/superadmin/admins', color: 'amber' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
              bg-dark-700/40 border-dark-500/20 hover:border-${action.color}-500/30
              hover:bg-${action.color}-500/5 group`}
          >
            <action.icon className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
            <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" /> Recent Activity
          </h3>
          {activity.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="mt-0.5">{activityIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 leading-snug">{item.message}</p>
                    <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimeAgo(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-8">
              {loading ? 'Loading...' : 'No recent activity.'}
            </p>
          )}
        </div>

        {/* Recent Institutions */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-heading flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" /> Recent Institutions
            </h3>
            <span className="text-xs text-dark-400">{stats?.total || 0} total</span>
          </div>
          {recentInstitutions.length > 0 ? (
            <div className="space-y-2">
              {recentInstitutions.map(inst => (
                <div key={inst.id}
                  onClick={() => navigate(`/dashboard/superadmin/${inst.type === 'school' ? 'schools' : 'colleges'}/${inst.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-600/25
                    transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${inst.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
                      {inst.type === 'school'
                        ? <School className="w-4 h-4 text-brand-400" />
                        : <GraduationCap className="w-4 h-4 text-violet-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-50">{inst.name}</p>
                      <p className="text-xs text-dark-400">{inst.city || '—'} · {inst.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dark-500">{inst._count?.users || 0} users</span>
                    <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-8">
              {loading ? 'Loading...' : 'No institutions added yet.'}
            </p>
          )}
        </div>
      </div>


    </div>
  )
}
