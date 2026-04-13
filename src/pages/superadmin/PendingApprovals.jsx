import { useState } from 'react'
import {
  UserCheck, Clock, School, GraduationCap, AlertTriangle,
  CheckCircle2, Loader2
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import useAPI, { invalidateCache } from '../../hooks/useAPI'
import api from '../../api/client'

const APPROVAL_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'chairman', label: 'Chairman' },
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'dean', label: 'Dean' },
  { value: 'hod', label: 'HOD' },
]

// Extracted into a proper component so useState works correctly
function PendingUserRow({ user, isSelected, onToggleSelect, onApprove, onReject, approving, rejecting }) {
  const [individualRole, setIndividualRole] = useState('student')

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 transition-colors
        ${isSelected ? 'bg-brand-500/5' : 'hover:bg-dark-600/20'}`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
          ${isSelected
            ? 'border-brand-500 bg-brand-500'
            : 'border-dark-500/40 hover:border-dark-400'
          }`}
      >
        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center
            text-xs font-bold text-white shrink-0">
            {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-dark-100 truncate">{user.name}</p>
          <p className="text-xs text-dark-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Signed up time */}
      <span className="text-xs text-dark-500 hidden sm:block shrink-0">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>

      {/* Individual Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={individualRole}
          onChange={e => setIndividualRole(e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-dark-800/50 border border-dark-500/20
            text-xs text-dark-100 focus:outline-none appearance-none select-styled cursor-pointer"
        >
          {APPROVAL_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          onClick={() => onApprove(user.id, individualRole)}
          disabled={approving}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success/15 text-success
            border border-success/25 hover:bg-success/25 transition-all disabled:opacity-50"
        >
          {approving ? '...' : 'Approve'}
        </button>
        <button
          onClick={() => onReject(user.id)}
          disabled={rejecting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400
            border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          {rejecting ? '...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

export default function SuperAdminPendingApprovals() {
  // ─── Cached data fetching (capped at 100 on backend) ─────────────────
  const { data, loading, refetch } = useAPI('/superadmin/pending-users', {
    staleTime: 15_000,
    fallback: null,
  })

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRole, setBulkRole] = useState('student')
  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(null)

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data) return
    if (selectedIds.size === data.users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.users.map(u => u.id)))
    }
  }

  const handleApprove = async (userId, role) => {
    setApproving(userId)
    try {
      await api.patch(`/superadmin/users/${userId}/role`, { role })
      invalidateCache('/superadmin')
      refetch()
      setSelectedIds(prev => { const next = new Set(prev); next.delete(userId); return next })
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (userId) => {
    setRejecting(userId)
    try {
      await api.delete(`/superadmin/users/${userId}`)
      invalidateCache('/superadmin')
      refetch()
      setSelectedIds(prev => { const next = new Set(prev); next.delete(userId); return next })
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject')
    } finally {
      setRejecting(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setApproving('bulk')
    try {
      await api.post('/superadmin/bulk-approve', {
        userIds: Array.from(selectedIds),
        role: bulkRole,
      })
      setSelectedIds(new Set())
      invalidateCache('/superadmin')
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to bulk approve')
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-dark-700/40 rounded-lg" />
        <div className="h-4 w-72 bg-dark-700/40 rounded-lg" />
        <div className="h-20 bg-dark-700/40 rounded-2xl" />
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-dark-700/40 rounded-xl" />)}
      </div>
    )
  }

  const total = data?.total || 0
  const grouped = data?.grouped || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Pending Approvals</h1>
        <p className="text-sm text-dark-200 mt-1.5">
          {total === 0 ? 'No pending users — all clear! 🎉' : `${total} users awaiting approval across the platform`}
        </p>
      </div>

      {/* Alert Banner */}
      {total > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/25 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-300">
              {total} user{total > 1 ? 's' : ''} waiting for approval
            </p>
            <p className="text-xs text-dark-400 mt-0.5">Review and assign roles to new signups.</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {total > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-dark-800/50 border border-dark-500/20
              text-dark-300 hover:text-dark-100 transition-all"
          >
            {selectedIds.size === data?.users?.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-dark-400">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-dark-400">Approve as:</span>
                <select
                  value={bulkRole}
                  onChange={e => setBulkRole(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20
                    text-sm text-dark-100 focus:outline-none focus:border-brand-500/50 transition-all
                    appearance-none select-styled cursor-pointer"
                >
                  {APPROVAL_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkApprove}
                  disabled={approving === 'bulk'}
                  className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium
                    hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {approving === 'bulk' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                  ) : (
                    <><UserCheck className="w-4 h-4" /> Approve Selected</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Grouped by Institution */}
      {grouped.length > 0 ? grouped.map(group => (
        <div key={group.institution.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden">
          {/* Institution Header */}
          <div className="px-5 py-4 border-b border-dark-500/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                ${group.institution.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
                {group.institution.type === 'school'
                  ? <School className="w-4 h-4 text-brand-400" />
                  : <GraduationCap className="w-4 h-4 text-violet-400" />
                }
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-50">{group.institution.name}</h3>
                <p className="text-xs text-dark-400">{group.institution.code}</p>
              </div>
            </div>
            <Badge variant="warning" size="sm">
              <Clock className="w-3 h-3 mr-1" /> {group.users.length} pending
            </Badge>
          </div>

          {/* User Rows */}
          <div className="divide-y divide-dark-500/10">
            {group.users.map(user => (
              <PendingUserRow
                key={user.id}
                user={user}
                isSelected={selectedIds.has(user.id)}
                onToggleSelect={() => toggleSelect(user.id)}
                onApprove={handleApprove}
                onReject={handleReject}
                approving={approving === user.id}
                rejecting={rejecting === user.id}
              />
            ))}
          </div>
        </div>
      )) : (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-dark-200">All Clear!</h3>
          <p className="text-sm text-dark-400 mt-2">No pending approvals at this time.</p>
        </div>
      )}
    </div>
  )
}
