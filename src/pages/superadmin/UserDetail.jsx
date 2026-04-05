import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Shield, School, GraduationCap, MapPin, Calendar,
  BookOpen, ClipboardList, Award, Trash2, UserCheck, UserX,
  BarChart3, Layers, Building2
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../api/client'

const ASSIGNABLE_ROLES = [
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
  superadmin: 'bg-red-500/15 text-red-400 border-red-500/30',
  admin: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  principal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  vice_principal: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  chairman: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  vice_chairman: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  dean: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  hod: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  teacher: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  student: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pending: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export default function SuperAdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleChanging, setRoleChanging] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchUser = async () => {
    try {
      const res = await api.get(`/superadmin/users/${userId}`)
      setUser(res.data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUser() }, [userId])

  const handleRoleChange = async (newRole) => {
    setRoleChanging(true)
    try {
      await api.patch(`/superadmin/users/${userId}/role`, { role: newRole })
      await fetchUser()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role')
    } finally {
      setRoleChanging(false)
    }
  }

  const handleApprovalToggle = async () => {
    try {
      await api.patch(`/superadmin/users/${userId}/approval`, { isApproved: !user.isApproved })
      await fetchUser()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle approval')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/superadmin/users/${userId}`)
      navigate('/dashboard/superadmin/users')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
      setDeleting(false)
    }
  }

  const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-dark-700/40 rounded" />
        <div className="h-48 bg-dark-700/40 rounded-2xl" />
        <div className="h-64 bg-dark-700/40 rounded-2xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-200">User not found</h2>
        <button onClick={() => navigate('/dashboard/superadmin/users')}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300">← Back to Users</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/dashboard/superadmin/users')}
        className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-100 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* Profile Header */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        <div className="relative p-6 flex flex-col sm:flex-row items-start gap-5">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-2xl shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center
              text-xl font-bold text-white shadow-glow shrink-0">
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-extrabold font-heading text-dark-50">{user.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border
                ${ROLE_COLORS[user.role] || 'bg-dark-600 text-dark-300 border-dark-500'}`}>
                {formatRole(user.role)}
              </span>
              {user.isApproved ? (
                <Badge variant="success" size="sm"><UserCheck className="w-3 h-3 mr-1" /> Approved</Badge>
              ) : (
                <Badge variant="warning" size="sm"><UserX className="w-3 h-3 mr-1" /> Pending</Badge>
              )}
            </div>
            <p className="text-sm text-dark-300 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
            {user.institution && (
              <p className="text-sm text-dark-400 flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4" /> {user.institution.name}
                {user.institution.city && <><MapPin className="w-3 h-3 ml-2" /> {user.institution.city}</>}
              </p>
            )}
            <p className="text-xs text-dark-500 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {(user.attendanceSummary?.total > 0 || user.averageScore !== null || user.certificatesEarned?.length > 0) && (
          <div className="grid grid-cols-3 gap-px bg-dark-500/15 relative">
            <div className="bg-dark-700/60 px-6 py-4 text-center">
              <p className="text-2xl font-extrabold font-heading text-dark-50">
                {user.attendanceSummary?.rate !== null ? `${user.attendanceSummary.rate}%` : '—'}
              </p>
              <p className="text-xs text-dark-400 mt-0.5 flex items-center justify-center gap-1">
                <ClipboardList className="w-3 h-3" /> Attendance
              </p>
            </div>
            <div className="bg-dark-700/60 px-6 py-4 text-center">
              <p className="text-2xl font-extrabold font-heading text-brand-400">
                {user.averageScore !== null ? `${user.averageScore}%` : '—'}
              </p>
              <p className="text-xs text-dark-400 mt-0.5 flex items-center justify-center gap-1">
                <BarChart3 className="w-3 h-3" /> Avg Score
              </p>
            </div>
            <div className="bg-dark-700/60 px-6 py-4 text-center">
              <p className="text-2xl font-extrabold font-heading text-violet-400">
                {user.certificatesEarned?.length || 0}
              </p>
              <p className="text-xs text-dark-400 mt-0.5 flex items-center justify-center gap-1">
                <Award className="w-3 h-3" /> Certificates
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Role & Approval Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Role */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Change Role</h3>
          <p className="text-xs text-dark-400 mb-4">Assign a new role to this user.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ASSIGNABLE_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRoleChange(r.value)}
                disabled={roleChanging || user.role === r.value}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all border
                  ${user.role === r.value
                    ? `${ROLE_COLORS[r.value] || 'bg-dark-600 text-dark-300'} border-current`
                    : 'bg-dark-800/50 text-dark-400 border-dark-500/20 hover:text-dark-200 hover:border-dark-500/40'
                  } disabled:opacity-50`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Approval & Info */}
        <div className="space-y-6">
          {/* Toggle Approval */}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-1">Approval Status</h3>
            <p className="text-xs text-dark-400 mb-4">Toggle this user's approval status.</p>
            <button
              onClick={handleApprovalToggle}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all border
                ${user.isApproved
                  ? 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                }`}
            >
              {user.isApproved ? '✓ Approved — Click to Revoke' : '⏳ Pending — Click to Approve'}
            </button>
          </div>

          {/* Academic Info */}
          {(user.grade || user.section || user.department) && (
            <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <h3 className="font-semibold font-heading mb-3">Academic Details</h3>
              <div className="space-y-2">
                {user.grade && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400 flex items-center gap-2"><Layers className="w-4 h-4" /> Grade</span>
                    <span className="text-dark-100 font-medium">{user.grade.name}</span>
                  </div>
                )}
                {user.section && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Section</span>
                    <span className="text-dark-100 font-medium">{user.section.name}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Department</span>
                    <span className="text-dark-100 font-medium">{user.department.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Assignments */}
      {user.teacherAssignments?.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Teaching Assignments</h3>
          <p className="text-xs text-dark-400 mb-4">Subjects and sections assigned to this teacher.</p>
          <div className="space-y-2">
            {user.teacherAssignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-100">{a.subject?.name || '—'}</p>
                    <p className="text-xs text-dark-400">
                      {a.section?.grade?.name ? `Grade ${a.section.grade.name}` : ''}{a.section?.name ? ` - Section ${a.section.name}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Results */}
      {user.assessmentResults?.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Assessment Results</h3>
          <p className="text-xs text-dark-400 mb-4">Scores from completed assessments.</p>
          <div className="space-y-2">
            {user.assessmentResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <span className="text-sm text-dark-100">{r.assessment?.title || 'Assessment'}</span>
                <span className={`text-sm font-bold ${r.score >= 70 ? 'text-success' : r.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {r.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {user.certificatesEarned?.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Certificates Earned</h3>
          <div className="space-y-2 mt-4">
            {user.certificatesEarned.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-dark-100">{c.title}</p>
                    <p className="text-xs text-dark-400">{c.subject?.name}</p>
                  </div>
                </div>
                <span className="text-xs text-dark-500">{new Date(c.issuedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-semibold font-heading text-red-400 mb-1">Danger Zone</h3>
        <p className="text-xs text-dark-400 mb-4">
          Permanently delete this user and all their associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30
            hover:bg-red-500/10 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Delete This User
        </button>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${user.name}"? All attendance, assessment, and certificate data will be lost.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
      />
    </div>
  )
}
