import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Plus, MapPin, Loader2, Trash2, ExternalLink, Search } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { usePaginatedAPI, invalidateCache } from '../../hooks/useAPI'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import api from '../../api/client'

const PAGE_SIZE = 20

export default function SuperAdminColleges() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [newInst, setNewInst] = useState({ name: '', city: '' })
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const sentinelRef = useRef(null)

  // ─── Cached paginated data fetching with server-side search ─────────────
  const {
    items: colleges, loading, loadingMore, hasMore, total,
    loadMore, reset, setItems
  } = usePaginatedAPI('/superadmin/institutions', {
    params: { type: 'college', search: debouncedSearch },
    pageSize: PAGE_SIZE,
    staleTime: 120_000,
  })

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  const handleCreate = async () => {
    if (!newInst.name) return
    setCreating(true)
    try {
      await api.post('/superadmin/institutions', { ...newInst, type: 'college' })
      setShowModal(false)
      setNewInst({ name: '', city: '' })
      invalidateCache('/superadmin')
      reset()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create college')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id, isActive) => {
    try {
      await api.patch(`/superadmin/institutions/${id}`, { isActive: !isActive })
      setItems(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
    } catch {}
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/superadmin/institutions/${deleteTarget.id}`)
      setItems(prev => prev.filter(c => c.id !== deleteTarget.id))
      invalidateCache('/superadmin')
      setDeleteTarget(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete college')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { header: 'College', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/superadmin/colleges/${row.id}`)}>
        <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <p className="font-medium text-dark-50 hover:text-violet-400 transition-colors flex items-center gap-1.5">
            {row.name} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
          </p>
          <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{row.city || '—'}</p>
        </div>
      </div>
    )},
    { header: 'Code', accessor: 'code', cell: (row) => (
      <span className="font-mono text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded">{row.code}</span>
    )},
    { header: 'Users', accessor: '_count', cell: (row) => (
      <span className="text-sm text-dark-200">{row._count?.users || 0}</span>
    )},
    { header: 'Status', accessor: 'isActive', cell: (row) => (
      <ToggleSwitch enabled={row.isActive} onChange={() => handleToggle(row.id, row.isActive)} />
    )},
    { header: '', accessor: 'actions', cell: (row) => (
      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
        className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete college">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Colleges</h1>
          <p className="text-sm text-dark-200 mt-1.5">
            {loading ? 'Loading...' : `${total} colleges on the platform`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
            flex items-center gap-2 hover:shadow-glow transition-all" id="add-college-btn">
          <Plus className="w-4 h-4" /> Add College
        </button>
      </div>

      {/* Server-side search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input type="text" placeholder="Search colleges..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-10 rounded-xl bg-dark-700/60 border border-dark-500/25
            text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500/50
            focus:ring-1 focus:ring-brand-500/20 transition-all" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-dark-700/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={colleges} searchable={false} />

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-dark-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading more colleges...
            </div>
          )}

          {!hasMore && colleges.length > 0 && (
            <p className="text-center text-xs text-dark-500 py-2">
              Showing all {colleges.length} colleges
            </p>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setNewInst({ name: '', city: '' }) }}
        title="Add New College"
        footer={<>
          <button onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-dark-200
              hover:bg-dark-600/60 border border-dark-500/40 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={creating || !newInst.name}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
              hover:shadow-glow transition-all disabled:opacity-50">
            {creating ? 'Creating...' : 'Add College'}
          </button>
        </>}>
        <div className="space-y-4">
          <FormInput label="College Name" placeholder="e.g., PSG College of Technology" required
            value={newInst.name} onChange={e => setNewInst({ ...newInst, name: e.target.value })} />
          <FormInput label="City" placeholder="e.g., Coimbatore"
            value={newInst.city} onChange={e => setNewInst({ ...newInst, city: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete College"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all users, departments, subjects, and related data.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete College'}
        variant="danger"
      />
    </div>
  )
}
