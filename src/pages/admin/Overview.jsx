import { useNavigate } from 'react-router-dom'
import { Building2, Users, GraduationCap, UserCheck, AlertTriangle, ChevronRight, BarChart3, FileText, Settings } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import useAPI, { useMultiAPI } from '../../hooks/useAPI'

export default function AdminOverview() {
  const navigate = useNavigate()

  const { data, loading } = useMultiAPI([
    { url: '/admin/overview', key: 'overview', staleTime: 60_000, fallback: {} },
    { url: '/admin/institutions', key: 'institutions', staleTime: 60_000, fallback: [] },
  ])

  const stats = data.overview || {}
  const institutions = data.institutions || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Admin Dashboard</h1>
        <p className="text-sm text-dark-200 mt-1.5">Overview of all your assigned institutions.</p>
      </div>

      {stats.pending > 0 && (
        <button
          onClick={() => navigate('/dashboard/admin/pending')}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Institutions" value={loading ? '—' : (stats.institutions || 0).toString()} />
        <StatCard icon={Users} label="Total Users" value={loading ? '—' : (stats.totalUsers || 0).toLocaleString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (stats.students || 0).toString()} />
        <StatCard icon={UserCheck} label="Teachers" value={loading ? '—' : (stats.teachers || 0).toString()} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Institutions', icon: Building2, path: '/dashboard/admin/institutions', color: 'brand' },
          { label: 'Pending Approvals', icon: UserCheck, path: '/dashboard/admin/pending', color: 'orange' },
          { label: 'Reports', icon: BarChart3, path: '/dashboard/admin/reports', color: 'emerald' },
          { label: 'Settings', icon: Settings, path: '/dashboard/admin/settings', color: 'violet' },
        ].map(action => (
          <button key={action.label} onClick={() => navigate(action.path)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
              bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
            <action.icon className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
            <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Institution Cards */}
      <div>
        <h2 className="text-lg font-bold font-heading mb-4">My Institutions</h2>
        {institutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {institutions.map(inst => (
              <div key={inst.id} onClick={() => navigate(`/dashboard/admin/institutions/${inst.id}`)}
                className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden card-hover group cursor-pointer">
                <div className={`px-5 pt-5 pb-4 border-b border-dark-500/25
                  ${inst.type === 'school' ? 'bg-gradient-to-r from-brand-500/5 to-transparent' : 'bg-gradient-to-r from-violet-500/5 to-transparent'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        ${inst.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
                        <Building2 className={`w-5 h-5 ${inst.type === 'school' ? 'text-brand-400' : 'text-violet-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-50 font-heading">{inst.name}</h3>
                        <p className="text-xs text-dark-400 font-mono">{inst.code}</p>
                      </div>
                    </div>
                    {(inst.stats?.pending || 0) > 0 && (
                      <Badge variant="warning" size="sm" dot>{inst.stats.pending} pending</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-dark-500/20">
                  {[
                    { icon: GraduationCap, label: 'Students', value: inst.stats?.students || 0 },
                    { icon: Users, label: 'Teachers', value: inst.stats?.teachers || 0 },
                  ].map((stat, i) => (
                    <div key={i} className="bg-dark-700/60 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-[11px] text-dark-400">{stat.label}</span>
                      </div>
                      <p className="text-lg font-bold font-heading text-dark-50">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 flex items-center justify-between bg-dark-800/30">
                  <Badge variant={inst.type === 'school' ? 'brand' : 'violet'} size="sm">{inst.type}</Badge>
                  <span className="text-xs text-dark-400 flex items-center gap-1 group-hover:text-brand-400 transition-colors">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-200">
              {loading ? 'Loading...' : 'No institutions assigned'}
            </h3>
            <p className="text-sm text-dark-400 mt-2">Contact the Super Admin to get institutions assigned.</p>
          </div>
        )}
      </div>
    </div>
  )
}
