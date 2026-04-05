import { useState } from 'react'
import { Building2, Plus, MapPin } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import useAPI, { invalidateCache } from '../../hooks/useAPI'
import api from '../../api/client'

export default function SuperAdminInstitutions() {
  const [showModal, setShowModal] = useState(false)
  const [newInst, setNewInst] = useState({ name: '', type: 'school', city: '' })
  const { data: institutions, refetch } = useAPI('/superadmin/institutions', {
    fallback: [],
    staleTime: 60_000,
  })
  const [localInstitutions, setLocalInstitutions] = useState(null)

  const displayInstitutions = localInstitutions ?? institutions ?? []

  const handleCreate = async () => {
    if (!newInst.name || !newInst.type) return
    setCreating(true)
    try {
      await api.post('/superadmin/institutions', newInst)
      setShowModal(false)
      setNewInst({ name: '', type: 'school', city: '' })
      invalidateCache('/superadmin/')
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create institution')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id, isActive) => {
    try {
      await api.patch(`/superadmin/institutions/${id}`, { isActive: !isActive })
      setLocalInstitutions(prev => (prev ?? displayInstitutions).map(inst =>
        inst.id === id ? { ...inst, isActive: !inst.isActive } : inst
      ))
    } catch {}
  }

  const columns = [
    { header: 'Institution', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${row.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
          <Building2 className={`w-4 h-4 ${row.type === 'school' ? 'text-brand-400' : 'text-violet-400'}`} />
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{row.city || '—'}</p>
        </div>
      </div>
    )},
    { header: 'Type', accessor: 'type', cell: (row) => (
      <Badge variant={row.type === 'school' ? 'brand' : 'violet'} size="sm">{row.type}</Badge>
    )},
    { header: 'Code', accessor: 'code', cell: (row) => (
      <span className="font-mono text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded">{row.code}</span>
    )},
    { header: 'Status', accessor: 'isActive', cell: (row) => (
      <ToggleSwitch enabled={row.isActive} onChange={() => handleToggle(row.id, row.isActive)} />
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Institutions</h1>
          <p className="text-sm text-dark-200 mt-1.5">Manage all schools and colleges on the platform.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={displayInstitutions}
        searchPlaceholder="Search institutions..."
        actions={
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
              flex items-center gap-2 hover:shadow-glow transition-all" id="add-institution-btn">
            <Plus className="w-4 h-4" /> Add Institution
          </button>
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setNewInst({ name: '', type: 'school', city: '' }) }}
        title="Add New Institution"
        footer={
          <>
            <button onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-dark-200
                hover:bg-dark-600/60 border border-dark-500/40 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating || !newInst.name}
              className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
                hover:shadow-glow transition-all disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Institution'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormInput label="Institution Name" placeholder="Enter institution name"
            value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })} required />
          <FormInput label="Type" type="select" value={newInst.type}
            onChange={(e) => setNewInst({ ...newInst, type: e.target.value })}>
            <option value="school">School</option>
            <option value="college">College</option>
          </FormInput>
          <FormInput label="City" placeholder="Enter city"
            value={newInst.city} onChange={(e) => setNewInst({ ...newInst, city: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
