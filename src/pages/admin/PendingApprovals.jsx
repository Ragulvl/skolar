import { useState } from 'react'
import { UserCheck, Users, ChevronDown } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import useAPI, { invalidateCache } from '../../hooks/useAPI'
import api from '../../api/client'

const allRoles = [
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'chairman', label: 'Chairman' },
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'dean', label: 'Dean' },
  { value: 'hod', label: 'HOD' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export default function AdminPendingApprovals() {
  const { data: users, loading, refetch } = useAPI('/admin/all-pending', { fallback: [], staleTime: 30_000 })
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
    } catch {
    } finally {
      setProcessing(p => ({ ...p, [userId]: false }))
    }
  }

  const handleReject = async (userId) => {
    setProcessing(p => ({ ...p, [userId]: true }))
    try {
      await api.patch('/admin/reject-user', { userId })
      invalidateCache('/admin')
      refetch()
    } catch {
    } finally {
      setProcessing(p => ({ ...p, [userId]: false }))
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Pending Approvals</h1>
        <p className="text-sm text-dark-200 mt-1.5">Review and assign roles to new user signups across your institutions.</p>
      </div>

      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                      {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-dark-50">{user.name}</p>
                    <p className="text-xs text-dark-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.institution && (
                        <Badge variant={user.institution.type === 'school' ? 'brand' : 'violet'} size="sm">
                          {user.institution.name}
                        </Badge>
                      )}
                      <span className="text-xs text-dark-500">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedRoles[user.id] || ''}
                      onChange={(e) => setSelectedRoles(p => ({ ...p, [user.id]: e.target.value }))}
                      className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-dark-800 border border-dark-500/40
                        text-sm text-dark-50 focus:outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="">Select role</option>
                      {allRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-dark-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={!selectedRoles[user.id] || processing[user.id]}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-success/15 text-success hover:bg-success/25
                      disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={processing[user.id]}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-danger/15 text-danger hover:bg-danger/25
                      disabled:opacity-30 transition-colors"
                  >
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
          <p className="text-sm text-dark-400 mt-2">All users are approved. Check back later.</p>
        </div>
      )}
    </div>
  )
}
