import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users as UsersIcon, Search, Filter, ChevronRight, Trash2,
  Shield, GraduationCap, School, UserCheck, UserX, Mail, Loader2
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../api/client'

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'chairman', label: 'Chairman' },
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'dean', label: 'Dean' },
  { value: 'hod', label: 'HOD' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'pending', label: 'Pending' },
]

const ROLE_COLORS = {
  superadmin: 'bg-red-500/15 text-red-400',
  admin: 'bg-brand-500/15 text-brand-400',
  principal: 'bg-amber-500/15 text-amber-400',
  vice_principal: 'bg-amber-500/10 text-amber-300',
  chairman: 'bg-violet-500/15 text-violet-400',
  vice_chairman: 'bg-violet-500/10 text-violet-300',
  dean: 'bg-cyan-500/15 text-cyan-400',
  hod: 'bg-teal-500/15 text-teal-400',
  teacher: 'bg-emerald-500/15 text-emerald-400',
  student: 'bg-blue-500/15 text-blue-400',
  pending: 'bg-orange-500/15 text-orange-400',
}

const PAGE_SIZE = 20

export default function SuperAdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const cursorRef = useRef(null)
  const sentinelRef = useRef(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const searchTimeout = useRef(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async (cursor = null, reset = false) => {
    const isInitial = !cursor
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE })
      if (cursor) params.set('cursor', cursor)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (approvalFilter !== 'all') params.set('approved', approvalFilter)
      if (search) params.set('search', search)

      const res = await api.get(`/superadmin/users?${params}`)
      const { data, pagination } = res.data

      setUsers(prev => isInitial || reset ? data : [...prev, ...data])
      setHasMore(pagination.hasMore)
      setTotal(pagination.total)
      cursorRef.current = pagination.nextCursor
    } catch {}
    finally {
      if (isInitial) setLoading(false)
      else setLoadingMore(false)
    }
  }, [roleFilter, approvalFilter, search])

  // Re-fetch when filters change
  useEffect(() => {
    cursorRef.current = null
    fetchUsers(null, true)
  }, [fetchUsers])

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val)
  }

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchUsers(cursorRef.current)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, fetchUsers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/superadmin/users/${deleteTarget.id}`)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setTotal(prev => prev - 1)
      setDeleteTarget(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold font-heading">All Users</h1>
        <p className="text-sm text-dark-200 mt-1.5">
          {loading ? 'Loading...' : `${total} users across the platform`}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-500/20
                text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none
                focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-500/20
              text-sm text-dark-100 focus:outline-none focus:border-brand-500/50 transition-all
              appearance-none cursor-pointer min-w-[140px]"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Approval filter */}
          <select
            value={approvalFilter}
            onChange={e => setApprovalFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-500/20
              text-sm text-dark-100 focus:outline-none focus:border-brand-500/50 transition-all
              appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Not Approved</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-16 bg-dark-700/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_150px_180px_100px_80px] gap-4 px-5 py-3
            border-b border-dark-500/15 text-xs font-semibold text-dark-400 uppercase tracking-wider">
            <span>User</span>
            <span>Role</span>
            <span>Institution</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-dark-500/10">
            {users.map(user => (
              <div
                key={user.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_150px_180px_100px_80px] gap-3 md:gap-4
                  px-5 py-3.5 hover:bg-dark-600/20 transition-colors cursor-pointer group items-center"
                onClick={() => navigate(`/dashboard/superadmin/users/${user.id}`)}
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center
                      text-xs font-bold text-white shrink-0">
                      {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-50 truncate">{user.name}</p>
                    <p className="text-xs text-dark-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" /> {user.email}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                    ${ROLE_COLORS[user.role] || 'bg-dark-600 text-dark-300'}`}>
                    {formatRole(user.role)}
                  </span>
                </div>

                {/* Institution */}
                <div className="flex items-center gap-2 min-w-0">
                  {user.institution ? (
                    <>
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0
                        ${user.institution.type === 'school' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
                        {user.institution.type === 'school'
                          ? <School className="w-3 h-3 text-brand-400" />
                          : <GraduationCap className="w-3 h-3 text-violet-400" />
                        }
                      </div>
                      <span className="text-sm text-dark-200 truncate">{user.institution.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-dark-500 italic">None</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  {user.isApproved ? (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <UserCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                      <UserX className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(user) }}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10
                      transition-all opacity-0 group-hover:opacity-100"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-dark-500/15 flex items-center justify-between">
            <p className="text-xs text-dark-500">Showing {users.length} of {total} users</p>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          <UsersIcon className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-200">No users found</h3>
          <p className="text-sm text-dark-400 mt-2">Try adjusting your filters.</p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {loadingMore && (
        <div className="flex items-center justify-center py-4 gap-2 text-sm text-dark-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading more users...
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all their data including attendance, assessments, and certificates.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete User'}
        variant="danger"
      />
    </div>
  )
}
