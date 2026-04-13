import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Shield, MapPin, Calendar,
  BookOpen, ClipboardList, Trash2, UserCheck, UserX,
  BarChart3, Layers, Building2, AlertTriangle,
  Crown, GraduationCap, Briefcase, Users, Star, Check, ChevronRight
} from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useAPI, { invalidateCache } from '../../hooks/useAPI'
import api from '../../api/client'

const ROLE_GROUPS = [
  {
    label: 'Leadership',
    roles: [
      { value: 'superadmin', label: 'Super Admin', icon: Crown, color: '#ef4444' },
      { value: 'admin', label: 'Admin', icon: Shield, color: '#6366f1' },
      { value: 'principal', label: 'Principal', icon: Star, color: '#f59e0b' },
      { value: 'vice_principal', label: 'Vice Principal', icon: Star, color: '#fbbf24' },
    ],
  },
  {
    label: 'Management',
    roles: [
      { value: 'chairman', label: 'Chairman', icon: Briefcase, color: '#8b5cf6' },
      { value: 'vice_chairman', label: 'Vice Chairman', icon: Briefcase, color: '#a78bfa' },
      { value: 'dean', label: 'Dean', icon: GraduationCap, color: '#06b6d4' },
      { value: 'hod', label: 'HOD', icon: Users, color: '#14b8a6' },
    ],
  },
  {
    label: 'Members',
    roles: [
      { value: 'teacher', label: 'Teacher', icon: BookOpen, color: '#10b981' },
      { value: 'student', label: 'Student', icon: GraduationCap, color: '#3b82f6' },
      { value: 'pending', label: 'Pending', icon: ClipboardList, color: '#f97316' },
    ],
  },
]

const ALL_ROLES = ROLE_GROUPS.flatMap(g => g.roles)

export default function SuperAdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()

  // ─── Cached data fetching ─────────────────────────────────────────────
  const { data: user, loading, refetch } = useAPI(
    userId ? `/superadmin/users/${userId}` : null,
    { staleTime: 60_000, fallback: null }
  )

  const [roleChanging, setRoleChanging] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [showRoleConfirm, setShowRoleConfirm] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)

  const handleRoleSelect = (newRole) => {
    if (newRole === user.role || roleChanging) return
    setSelectedRole(newRole)
    setShowRoleConfirm(true)
  }

  const handleRoleConfirm = async () => {
    if (!selectedRole) return
    setShowRoleConfirm(false)
    setRoleChanging(true)
    try {
      await api.patch(`/superadmin/users/${userId}/role`, { role: selectedRole })
      invalidateCache('/superadmin')
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role')
    } finally {
      setRoleChanging(false)
      setSelectedRole(null)
    }
  }

  const handleApprovalToggle = async () => {
    setApprovalLoading(true)
    try {
      await api.patch(`/superadmin/users/${userId}/approval`, { isApproved: !user.isApproved })
      invalidateCache('/superadmin')
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle approval')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/superadmin/users/${userId}`)
      invalidateCache('/superadmin')
      navigate('/dashboard/superadmin/users')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
      setDeleting(false)
    }
  }

  const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  const getRoleConfig = (role) => ALL_ROLES.find(r => r.value === role) || ALL_ROLES[ALL_ROLES.length - 1]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" style={{ maxWidth: 960 }}>
        <div className="h-6 w-32 bg-dark-700/40 rounded" />
        <div className="h-36 bg-dark-700/40 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-dark-700/40 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-200">User not found</h2>
        <button onClick={() => navigate('/dashboard/superadmin/users')}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors">← Back to Users</button>
      </div>
    )
  }

  const rc = getRoleConfig(user.role)
  const hasAcademicInfo = user.grade || user.section || user.department
  const hasAssignments = user.teacherAssignments?.length > 0
  const hasResults = user.assessmentResults?.length > 0

  /* ─────── Utility: single info row ─────── */
  const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-800/25 border border-dark-500/8">
      <span className="text-[11px] text-dark-500 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[13px] text-dark-200 font-medium truncate ml-4 text-right">{value}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 960 }} className="pb-8 space-y-6 mx-auto">

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/superadmin/users')}
        className="group inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-100 transition-all">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Users
      </button>

      {/* ═══════════ PROFILE CARD ═══════════ */}
      <section className="rounded-2xl border border-dark-500/20 bg-dark-700/40 overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${rc.color}, ${rc.color}30, transparent)` }} />
        <div className="p-6 flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-xl shrink-0 ring-2 ring-dark-500/20" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${rc.color}cc, ${rc.color}80)`, boxShadow: `0 4px 20px ${rc.color}25` }}>
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold font-heading text-dark-50 tracking-tight">{user.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border"
                style={{ backgroundColor: `${rc.color}12`, borderColor: `${rc.color}25`, color: rc.color }}>
                <rc.icon className="w-3 h-3" />
                {formatRole(user.role)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border
                ${user.isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {user.isApproved ? <><UserCheck className="w-3 h-3" /> Approved</> : <><UserX className="w-3 h-3" /> Pending</>}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-dark-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-dark-500" />{user.email}</span>
              {user.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-dark-500" />{user.institution.name}
                  {user.institution.city && <><span className="text-dark-600 mx-0.5">·</span><MapPin className="w-3 h-3 text-dark-500" />{user.institution.city}</>}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-dark-500">
                <Calendar className="w-3 h-3" />
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Stats pills */}
          {(user.attendanceSummary?.total > 0 || user.averageScore !== null) && (
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-500/10">
                <p className="text-base font-extrabold font-heading text-dark-50">{user.attendanceSummary?.rate != null ? `${user.attendanceSummary.rate}%` : '—'}</p>
                <p className="text-[10px] text-dark-500 uppercase tracking-wider">Attendance</p>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-500/10">
                <p className="text-base font-extrabold font-heading text-brand-400">{user.averageScore != null ? `${user.averageScore}%` : '—'}</p>
                <p className="text-[10px] text-dark-500 uppercase tracking-wider">Avg Score</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ THREE-COLUMN ROW: Role groups + Approval ═══════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Role Groups — spans 3 columns */}
        {ROLE_GROUPS.map((group) => (
          <div key={group.label} className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5 flex flex-col">
            <h3 className="text-[11px] font-bold text-dark-500 uppercase tracking-widest mb-3">{group.label}</h3>
            <div className="flex-1 space-y-1.5">
              {group.roles.map(r => {
                const Icon = r.icon
                const isActive = user.role === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => handleRoleSelect(r.value)}
                    disabled={roleChanging || isActive}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium
                      transition-all duration-150 border cursor-pointer disabled:cursor-default text-left"
                    style={isActive ? {
                      backgroundColor: `${r.color}10`,
                      borderColor: `${r.color}30`,
                      color: r.color,
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(60,65,90,0.12)',
                      color: 'rgba(160,165,185,1)',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = `${r.color}35`; e.currentTarget.style.backgroundColor = `${r.color}06`; e.currentTarget.style.color = r.color } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(60,65,90,0.12)'; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(160,165,185,1)' } }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isActive ? `${r.color}18` : 'rgba(40,44,65,0.3)' }}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1">{r.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Approval — 4th column */}
        <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5 flex flex-col">
          <h3 className="text-[11px] font-bold text-dark-500 uppercase tracking-widest mb-3">Approval</h3>

          <div className={`flex-1 flex flex-col rounded-xl p-4 border ${
            user.isApproved ? 'bg-emerald-500/[0.04] border-emerald-500/15' : 'bg-amber-500/[0.04] border-amber-500/15'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${user.isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ boxShadow: `0 0 6px ${user.isApproved ? '#10b98140' : '#f59e0b40'}` }} />
              <span className={`text-sm font-semibold ${user.isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {user.isApproved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <p className="text-[12px] text-dark-500 leading-relaxed mb-auto pb-3">
              {user.isApproved
                ? 'This user can log in. Revoking will block access.'
                : 'User cannot access the platform until approved.'}
            </p>
            <button
              onClick={handleApprovalToggle}
              disabled={approvalLoading}
              className={`w-full px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-2
                disabled:opacity-50 border ${user.isApproved
                  ? 'bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/15'
                  : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                }`}
            >
              {approvalLoading
                ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : user.isApproved
                  ? <><UserX className="w-3.5 h-3.5" /> Revoke</>
                  : <><UserCheck className="w-3.5 h-3.5" /> Approve</>}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ DETAILS ROW — Even 2-col or full width ═══════════ */}
      {(user.institution || hasAcademicInfo || hasAssignments || hasResults) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Institution / Academic */}
          <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h3 className="font-semibold font-heading text-dark-100 text-sm">
                {hasAcademicInfo ? 'Academic Details' : 'Institution'}
              </h3>
            </div>
            <div className="space-y-1.5">
              {user.institution && <InfoRow label="Institution" value={user.institution.name} />}
              {user.institution?.type && <InfoRow label="Type" value={user.institution.type.charAt(0).toUpperCase() + user.institution.type.slice(1)} />}
              {user.institution?.city && <InfoRow label="City" value={user.institution.city} />}
              {user.grade && <InfoRow label="Grade" value={user.grade.name} />}
              {user.section && <InfoRow label="Section" value={user.section.name} />}
              {user.department && <InfoRow label="Department" value={user.department.name} />}
            </div>
          </div>

          {/* Assignments or Results */}
          {hasAssignments ? (
            <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold font-heading text-dark-100 text-sm">Teaching Assignments</h3>
                  <p className="text-[11px] text-dark-500">{user.teacherAssignments.length} subject{user.teacherAssignments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {user.teacherAssignments.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/25 border border-dark-500/8 hover:border-dark-500/18 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-dark-200 truncate">{a.subject?.name || '—'}</p>
                      <p className="text-[11px] text-dark-500">
                        {a.section?.grade?.name ? `Grade ${a.section.grade.name}` : ''}{a.section?.name ? ` · Sec ${a.section.name}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-dark-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : hasResults ? (
            <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <h3 className="font-semibold font-heading text-dark-100 text-sm">Assessment Results</h3>
              </div>
              <div className="space-y-1.5">
                {user.assessmentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-800/25 border border-dark-500/8">
                    <span className="text-[13px] text-dark-200 truncate mr-3">{r.assessment?.title || 'Assessment'}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-12 rounded-full bg-dark-600/40 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-[13px] font-bold w-[34px] text-right" style={{ color: r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {r.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty placeholder to maintain 2-col grid */
            <div />
          )}
        </section>
      )}

      {/* ═══════════ DANGER ZONE ═══════════ */}
      <section className="rounded-2xl border border-red-500/12 bg-red-500/[0.025] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold font-heading text-red-400 text-sm">Delete User</h3>
              <p className="text-[12px] text-dark-500 leading-relaxed mt-0.5">
                Permanently remove this user and all associated data. This <strong className="text-red-400/70">cannot be undone</strong>.
              </p>
            </div>
          </div>
          <button onClick={() => setShowDelete(true)}
            className="shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold text-red-400 border border-red-500/20
              hover:bg-red-500/10 hover:border-red-500/35 transition-all flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Delete User
          </button>
        </div>
      </section>

      {/* ═══════════ DIALOGS ═══════════ */}
      <ConfirmDialog
        isOpen={showRoleConfirm}
        onClose={() => { setShowRoleConfirm(false); setSelectedRole(null) }}
        onConfirm={handleRoleConfirm}
        title="Change User Role"
        message={`Change "${user.name}"'s role from ${formatRole(user.role)} to ${formatRole(selectedRole)}?${selectedRole === 'pending' ? '\n\nThis will also revoke their approval status.' : ''}`}
        confirmLabel="Change Role"
        variant="warning"
      />
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${user.name}"? All attendance and assessment data will be lost.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
      />
    </div>
  )
}
