import { useState } from 'react'
import { UserCheck, ChevronDown } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

const schoolRoles = [
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export default function SchoolPrincipalPending() {
  const { user } = useAuth()
  const { data: pending, loading, refetch } = useAPI(
    user?.institutionId ? `/admin/pending/${user.institutionId}` : null,
    { fallback: [], staleTime: 30_000 }
  )
  const [selectedRoles, setSelectedRoles] = useState({})
  const [processing, setProcessing] = useState({})

  const handleApprove = async (userId) => {
    const role = selectedRoles[userId]
    if (!role) return
    setProcessing(p => ({ ...p, [userId]: true }))
    try {
      await api.patch('/admin/approve-user', { userId, role })
      invalidateCache('/admin')
      refetch()
    } catch {} finally { setProcessing(p => ({ ...p, [userId]: false })) }
  }

  const handleReject = async (userId) => {
    setProcessing(p => ({ ...p, [userId]: true }))
    try {
      await api.patch('/admin/reject-user', { userId })
      refetch()
    } catch {} finally { setProcessing(p => ({ ...p, [userId]: false })) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Pending Approvals</h1>
        <p className="text-sm text-dark-200 mt-1.5">Users who signed up with your school's institution code.</p>
      </div>

      {pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map(u => (
            <div key={u.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                      {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-dark-50">{u.name}</p>
                    <p className="text-xs text-dark-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedRoles[u.id] || ''} onChange={(e) => setSelectedRoles(p => ({ ...p, [u.id]: e.target.value }))}
                    className="appearance-none select-styled pl-3 pr-8 py-2 rounded-xl bg-dark-800 border border-dark-500/40 text-sm text-dark-50 focus:outline-none focus:border-brand-500">
                    <option value="">Select role</option>
                    {schoolRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button onClick={() => handleApprove(u.id)} disabled={!selectedRoles[u.id] || processing[u.id]}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-success/15 text-success hover:bg-success/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReject(u.id)} disabled={processing[u.id]}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-danger/15 text-danger hover:bg-danger/25 disabled:opacity-30 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          <UserCheck className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-200">{loading ? 'Loading...' : 'No pending approvals'}</h3>
          <p className="text-sm text-dark-400 mt-2">All users have been reviewed.</p>
        </div>
      )}
    </div>
  )
}
