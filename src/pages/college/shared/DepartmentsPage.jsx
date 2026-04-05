import { Building2, Plus, UserCog, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import { useAuth } from '../../../context/AuthContext'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'
import { getPermissions } from './permissions'

export default function DepartmentsPage({ basePath }) {
  const { user } = useAuth()
  const { data: departments, loading, refetch } = useAPI('/college-admin/departments', { fallback: [] })
  const perms = getPermissions(user?.role)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.post('/college-admin/departments', { name: newName })
      setNewName(''); setShowCreate(false)
      invalidateCache('/college-admin'); refetch()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? This cannot be undone.')) return
    try {
      await api.delete(`/college-admin/departments/${id}`)
      invalidateCache('/college-admin'); refetch()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
  }

  const columns = [
    { header: 'Department', accessor: 'name', cell: (row) => (
      <Link to={`${basePath}/departments/${row.id}`} className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-lg bg-brand-500/12 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-brand-400" />
        </div>
        <span className="font-medium text-dark-50 group-hover:text-brand-300 transition-colors">{row.name}</span>
      </Link>
    )},
    { header: 'HOD', cell: (row) => row.hod ? (
      <div className="text-sm"><span className="text-dark-100">{row.hod.name}</span></div>
    ) : <span className="text-xs text-dark-500 italic">Not assigned</span>},
    { header: 'Dean', cell: (row) => row.dean ? (
      <div className="text-sm"><span className="text-dark-100">{row.dean.name}</span></div>
    ) : <span className="text-xs text-dark-500 italic">Not assigned</span>},
    { header: 'Staff', cell: (row) => row.teacherCount || 0 },
    { header: 'Subjects', cell: (row) => row.subjectCount || 0 },
    ...(perms.canManageDepts ? [{ header: '', cell: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
        className="p-2 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-all" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    )}] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Departments</h1>
          <p className="text-sm text-dark-200 mt-1.5">All departments in your institution.</p>
        </div>
        {perms.canManageDepts && (
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium gradient-brand text-white hover:opacity-90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>
      <DataTable columns={columns} data={departments || []} searchPlaceholder="Search departments..." />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Department" footer={
        <>
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-dark-300">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !newName.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium gradient-brand text-white disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </>
      }>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Department name"
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-500/40 text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
      </Modal>
    </div>
  )
}
