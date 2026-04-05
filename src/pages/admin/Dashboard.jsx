import { Building2, Users, GraduationCap, ClipboardCheck, ChevronRight, Bell } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import useAPI from '../../hooks/useAPI'

export default function AdminDashboard() {
  const { data: institutions, loading } = useAPI('/admin/institutions', {
    fallback: [],
    staleTime: 60_000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Institutions</h1>
        <p className="text-sm text-dark-200 mt-1.5">Overview of all institutions assigned to you.</p>
      </div>

      {institutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {institutions.map(inst => (
            <div key={inst.id} className="bg-dark-700/60 border border-dark-500/25 rounded-xl overflow-hidden card-hover group cursor-pointer">
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
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                      <Bell className="w-3 h-3" /> {inst.stats.pending}
                    </span>
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
          <p className="text-sm text-dark-400 mt-2">Contact the Super Admin to get institutions assigned to your account.</p>
        </div>
      )}
    </div>
  )
}
