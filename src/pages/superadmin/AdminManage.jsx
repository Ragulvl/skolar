import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, School, GraduationCap, Mail, Shield,
  Search, CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import { useMultiAPI, invalidateCache } from '../../hooks/useAPI'
import api from '../../api/client'

export default function AdminManage() {
  const { adminId } = useParams()
  const navigate = useNavigate()

  // ─── Cached parallel data fetching ─────────────────────────────────────
  const { data: apiData, loading, refetch } = useMultiAPI([
    { url: '/superadmin/admins', key: 'admins', staleTime: 60_000, fallback: [] },
    { url: '/superadmin/institutions?limit=100', key: 'institutions', staleTime: 120_000, fallback: [],
      transform: (res) => res.data.data || [] },
  ])

  const admins = apiData.admins || []
  const allInstitutions = apiData.institutions || []
  const admin = admins.find(a => a.id === adminId) || null

  const [filter, setFilter] = useState('all') // all | assigned | unassigned
  const [typeFilter, setTypeFilter] = useState('all') // all | school | college
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState(null)

  const assignedIds = useMemo(() => {
    const set = new Set()
    ;(admin?.assignments || []).forEach(a => {
      if (a.isActive !== false) set.add(a.institution?.id)
    })
    return set
  }, [admin])

  const handleToggle = async (institutionId, isCurrentlyActive) => {
    setToggling(institutionId)
    try {
      await api.patch('/superadmin/assign', {
        adminId: admin.id,
        institutionId,
        isActive: !isCurrentlyActive,
      })
      invalidateCache('/superadmin/admins')
      refetch()
    } catch {}
    finally { setToggling(null) }
  }

  const filtered = useMemo(() => {
    return allInstitutions.filter(inst => {
      if (filter === 'assigned' && !assignedIds.has(inst.id)) return false
      if (filter === 'unassigned' && assignedIds.has(inst.id)) return false
      if (typeFilter !== 'all' && inst.type !== typeFilter) return false
      if (search && !inst.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allInstitutions, filter, typeFilter, search, assignedIds])

  const schoolCount = [...assignedIds].filter(id =>
    allInstitutions.find(i => i.id === id)?.type === 'school'
  ).length
  const collegeCount = assignedIds.size - schoolCount

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-dark-700/40 rounded" />
        <div className="h-36 bg-dark-700/40 rounded-2xl" />
        <div className="h-96 bg-dark-700/40 rounded-2xl" />
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-200">Admin not found</h2>
        <button onClick={() => navigate('/dashboard/superadmin/admins')}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300">← Back to Admins</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/dashboard/superadmin/admins')}
        className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-100 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Admins
      </button>

      {/* Admin Profile Header */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden relative">
        {/* Dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        <div className="relative p-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center
            text-xl font-bold text-white shadow-glow shrink-0">
            {admin.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold font-heading text-dark-50">{admin.name}</h1>
              <Badge variant="brand" size="md"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>
            </div>
            <p className="text-sm text-dark-300 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {admin.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-dark-500/15 relative">
          <div className="bg-dark-700/60 px-6 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-dark-50">{assignedIds.size}</p>
            <p className="text-xs text-dark-400 mt-0.5">Total Assigned</p>
          </div>
          <div className="bg-dark-700/60 px-6 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-brand-400">{schoolCount}</p>
            <p className="text-xs text-dark-400 mt-0.5 flex items-center justify-center gap-1">
              <School className="w-3 h-3" /> Schools
            </p>
          </div>
          <div className="bg-dark-700/60 px-6 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-violet-400">{collegeCount}</p>
            <p className="text-xs text-dark-400 mt-0.5 flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3" /> Colleges
            </p>
          </div>
        </div>
      </div>

      {/* Institution Assignment Controls */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h2 className="text-lg font-bold font-heading mb-1">Institution Assignments</h2>
        <p className="text-sm text-dark-400 mb-5">Toggle institutions ON/OFF for this admin.</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search institutions..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-800/50 border border-dark-500/20
                text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none
                focus:border-brand-500/50 transition-all" />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'unassigned', label: 'Unassigned' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filter === f.value
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'bg-dark-800/50 text-dark-400 border border-dark-500/20 hover:text-dark-200'
                  }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All Types' },
              { value: 'school', label: 'Schools', icon: School },
              { value: 'college', label: 'Colleges', icon: GraduationCap },
            ].map(f => (
              <button key={f.value} onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
                  ${typeFilter === f.value
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'bg-dark-800/50 text-dark-400 border border-dark-500/20 hover:text-dark-200'
                  }`}>
                {f.icon && <f.icon className="w-3 h-3" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Institution List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {filtered.length > 0 ? filtered.map(inst => {
            const isAssigned = assignedIds.has(inst.id)
            const isCurrentlyToggling = toggling === inst.id

            return (
              <div key={inst.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                  ${isAssigned
                    ? 'bg-brand-500/5 border-brand-500/15 hover:border-brand-500/30'
                    : 'bg-dark-800/30 border-dark-500/15 hover:border-dark-500/30'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                    ${inst.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
                    {inst.type === 'school'
                      ? <School className="w-4 h-4 text-brand-400" />
                      : <GraduationCap className="w-4 h-4 text-violet-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark-100 truncate">{inst.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={inst.type === 'school' ? 'brand' : 'violet'} size="sm">{inst.type}</Badge>
                      <span className="text-[11px] text-dark-500 font-mono">{inst.code}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isAssigned ? (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-dark-500">
                      <XCircle className="w-3.5 h-3.5" /> Not assigned
                    </span>
                  )}
                  {isCurrentlyToggling ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  ) : (
                    <ToggleSwitch enabled={isAssigned}
                      onChange={() => handleToggle(inst.id, isAssigned)} />
                  )}
                </div>
              </div>
            )
          }) : (
            <p className="text-sm text-dark-400 text-center py-8">No institutions match your filters.</p>
          )}
        </div>

        {/* Footer count */}
        <div className="mt-4 pt-3 border-t border-dark-500/15 flex items-center justify-between">
          <p className="text-xs text-dark-500">
            Showing {filtered.length} of {allInstitutions.length} institutions
          </p>
          <p className="text-xs text-dark-500">
            {assignedIds.size} assigned to this admin
          </p>
        </div>
      </div>
    </div>
  )
}
