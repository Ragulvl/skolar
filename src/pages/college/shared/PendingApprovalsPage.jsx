import { UserCheck, Check, X } from 'lucide-react'
import { useState } from 'react'
import DataTable from '../../../components/ui/DataTable'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

const ROLE_OPTIONS = [
  { value: 'dean', label: 'Dean' },
  { value: 'hod', label: 'HOD' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export default function PendingApprovalsPage() {
  const { data: pending, loading, refetch } = useAPI('/college-admin/pending', { fallback: [] })
  const [roles, setRoles] = useState({})

  const handleApprove = async (userId) => {
    const role = roles[userId]
    if (!role) return alert('Select a role first')
    try {
      await api.post('/college-admin/approve-user', { userId, role })
      invalidateCache('/college-admin')
      refetch()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
  }

  const handleReject = async (userId) => {
    if (!confirm('Reject and remove this user?')) return
    try {
      await api.post('/college-admin/reject-user', { userId })
      invalidateCache('/college-admin')
      refetch()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
  }

  const columns = [
    { header: 'User', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Applied', cell: (row) =>
      new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    { header: 'Assign Role', cell: (row) => (
      <select value={roles[row.id] || ''} onChange={(e) => setRoles(p => ({ ...p, [row.id]: e.target.value }))}
        className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-500/40 text-sm text-dark-100 focus:outline-none focus:border-brand-500">
        <option value="">Select role...</option>
        {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )},
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleApprove(row.id)}
          className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all" title="Approve">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => handleReject(row.id)}
          className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all" title="Reject">
          <X className="w-4 h-4" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Pending Approvals</h1>
        <p className="text-sm text-dark-200 mt-1.5">Review and approve new users for your institution.</p>
      </div>
      {(pending || []).length > 0 ? (
        <DataTable columns={columns} data={pending || []} searchPlaceholder="Search pending..." />
      ) : (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No pending users!</p>
        </div>
      )}
    </div>
  )
}
