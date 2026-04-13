import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, School, GraduationCap, ChevronRight, Mail, Shield, Loader2, ChevronDown, Search } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import { usePaginatedAPI, invalidateCache } from '../../hooks/useAPI'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import api from '../../api/client'

export default function SuperAdminAdmins() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items: admins, loading, loadingMore, hasMore, total, loadMore, reset } = usePaginatedAPI(
    '/superadmin/admins',
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const handleCreate = async () => {
    if (!newAdmin.name || !newAdmin.email) return
    setCreating(true)
    try {
      await api.post('/superadmin/admins', newAdmin)
      setShowModal(false)
      setNewAdmin({ name: '', email: '' })
      invalidateCache('/superadmin/admins')
      reset()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const MAX_VISIBLE_TAGS = 4

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Platform Admins</h1>
          <p className="text-sm text-dark-200 mt-1.5">
            {loading ? 'Loading...' : `${total} admin accounts on the platform`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
            flex items-center gap-2 hover:shadow-glow transition-all" id="add-admin-btn">
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input type="text" placeholder="Search admins..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25
            text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none
            focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" />
      </div>

      {/* Admin Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-dark-700/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : admins.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {admins.map(admin => {
              const activeAssignments = (admin.assignments || []).filter(a => a.isActive !== false)
              const schoolCount = activeAssignments.filter(a => a.institution?.type === 'school').length
              const collegeCount = activeAssignments.filter(a => a.institution?.type === 'college').length
              const visibleTags = activeAssignments.slice(0, MAX_VISIBLE_TAGS)
              const extraCount = activeAssignments.length - MAX_VISIBLE_TAGS

              return (
                <div key={admin.id}
                  className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden
                    group hover:border-brand-500/30 transition-all duration-300 relative"
                >
                  {/* Decorative dot pattern */}
                  <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.04]"
                    style={{
                      backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                      backgroundSize: '8px 8px',
                    }}
                  />

                  {/* Header */}
                  <div className="p-5 pb-4 border-b border-dark-500/15">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center
                        text-sm font-bold text-white shrink-0 shadow-glow">
                        {admin.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold font-heading text-dark-50 truncate">{admin.name}</h3>
                        <p className="text-xs text-dark-400 flex items-center gap-1.5 mt-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {admin.email}
                        </p>
                      </div>
                      <Badge variant="brand" size="sm" className="shrink-0">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </Badge>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-px bg-dark-500/15">
                    <div className="bg-dark-700/60 px-4 py-3 text-center">
                      <p className="text-lg font-bold font-heading text-dark-50">{activeAssignments.length}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider">Total</p>
                    </div>
                    <div className="bg-dark-700/60 px-4 py-3 text-center">
                      <p className="text-lg font-bold font-heading text-brand-400">{schoolCount}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <School className="w-3 h-3" /> Schools
                      </p>
                    </div>
                    <div className="bg-dark-700/60 px-4 py-3 text-center">
                      <p className="text-lg font-bold font-heading text-violet-400">{collegeCount}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <GraduationCap className="w-3 h-3" /> Colleges
                      </p>
                    </div>
                  </div>

                  {/* Institution Tags (fixed height) */}
                  <div className="p-4 h-[72px] overflow-hidden">
                    {visibleTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {visibleTags.map(a => (
                          <span key={a.institution?.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium
                              ${a.institution?.type === 'school'
                                ? 'bg-brand-500/10 text-brand-400'
                                : 'bg-violet-500/10 text-violet-400'
                              }`}>
                            {a.institution?.type === 'school'
                              ? <School className="w-2.5 h-2.5" />
                              : <GraduationCap className="w-2.5 h-2.5" />
                            }
                            {a.institution?.name?.length > 22
                              ? a.institution.name.slice(0, 22) + '…'
                              : a.institution?.name}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px]
                            font-medium bg-dark-600/60 text-dark-300">
                            +{extraCount} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-dark-500 italic">No institutions assigned</p>
                    )}
                  </div>

                  {/* Footer — Manage Button */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => navigate(`/dashboard/superadmin/admins/${admin.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                        bg-dark-600/40 border border-dark-500/25 text-sm font-medium text-dark-200
                        hover:bg-brand-500/10 hover:border-brand-500/30 hover:text-brand-400
                        transition-all duration-200 group/btn"
                    >
                      <Building2 className="w-4 h-4" />
                      Manage Admin
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover/btn:opacity-100
                        group-hover/btn:ml-0 transition-all duration-200" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25
                  text-sm font-medium text-dark-200 hover:bg-brand-500/10 hover:border-brand-500/30
                  hover:text-brand-400 transition-all duration-200 disabled:opacity-50
                  flex items-center gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading more...</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Load More</>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          <Shield className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-200">No admins found</h3>
          <p className="text-sm text-dark-400 mt-2">
            {search ? 'Try a different search term.' : 'Add your first admin to get started.'}
          </p>
        </div>
      )}

      {/* Create Admin Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Admin"
        footer={<>
          <button onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-dark-200
              hover:bg-dark-600/60 border border-dark-500/40 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={creating || !newAdmin.name || !newAdmin.email}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
              hover:shadow-glow transition-all disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Admin'}
          </button>
        </>}>
        <div className="space-y-4">
          <FormInput label="Full Name" placeholder="Enter admin name" required
            value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
          <FormInput label="Email" type="email" placeholder="Enter email" required
            value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
