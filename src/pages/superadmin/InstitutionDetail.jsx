import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, School, GraduationCap, MapPin, Users, UserCog,
  BookOpen, Layers, ClipboardList, Copy, CheckCircle2, Settings2,
  ChevronRight, ExternalLink
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import api from '../../api/client'

const ROLE_COLORS = {
  principal: 'text-amber-400',
  vice_principal: 'text-amber-300',
  chairman: 'text-violet-400',
  vice_chairman: 'text-violet-300',
  dean: 'text-cyan-400',
  hod: 'text-teal-400',
  teacher: 'text-emerald-400',
  student: 'text-blue-400',
  pending: 'text-orange-400',
  admin: 'text-brand-400',
}

export default function SuperAdminInstitutionDetail() {
  const { institutionId } = useParams()
  const navigate = useNavigate()
  const [inst, setInst] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', city: '' })

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/superadmin/institutions/${institutionId}/detail`)
      setInst(res.data.data)
      setEditForm({ name: res.data.data.name, city: res.data.data.city || '' })
    } catch {
      setInst(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [institutionId])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inst.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleActive = async () => {
    try {
      await api.patch(`/superadmin/institutions/${institutionId}`, { isActive: !inst.isActive })
      setInst(prev => ({ ...prev, isActive: !prev.isActive }))
    } catch {}
  }

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/superadmin/institutions/${institutionId}`, editForm)
      setInst(prev => ({ ...prev, ...editForm }))
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update')
    }
  }

  const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-dark-700/40 rounded" />
        <div className="h-56 bg-dark-700/40 rounded-2xl" />
        <div className="h-64 bg-dark-700/40 rounded-2xl" />
      </div>
    )
  }

  if (!inst) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-200">Institution not found</h2>
        <button onClick={() => navigate(-1)}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300">← Go Back</button>
      </div>
    )
  }

  const isSchool = inst.type === 'school'
  const roleCounts = inst.roleCounts || {}
  const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0)

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'academics', label: 'Academics', icon: BookOpen },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-100 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Institution Header */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow shrink-0
              ${isSchool ? 'bg-brand-500/20' : 'bg-violet-500/20'}`}>
              {isSchool
                ? <School className="w-8 h-8 text-brand-400" />
                : <GraduationCap className="w-8 h-8 text-violet-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20
                      text-sm text-dark-100 focus:outline-none focus:border-brand-500/50"
                    placeholder="Institution name"
                  />
                  <input
                    value={editForm.city}
                    onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20
                      text-sm text-dark-100 focus:outline-none focus:border-brand-500/50"
                    placeholder="City"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-medium">Save</button>
                    <button onClick={() => setEditing(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-dark-400 hover:text-dark-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-2xl font-extrabold font-heading text-dark-50">{inst.name}</h1>
                    <Badge variant={isSchool ? 'brand' : 'violet'} size="md">
                      {isSchool ? <School className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
                      {inst.type}
                    </Badge>
                    <Badge variant={inst.isActive ? 'success' : 'warning'} size="sm">
                      {inst.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {inst.city && (
                    <p className="text-sm text-dark-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4" /> {inst.city}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <button onClick={handleCopyCode}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-500/20
                        text-xs font-mono hover:border-brand-500/30 transition-all">
                      {copied ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-dark-400" />}
                      <span className={isSchool ? 'text-brand-400' : 'text-violet-400'}>{inst.code}</span>
                    </button>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-200 transition-colors">
                      <Settings2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-400">Active</span>
                      <ToggleSwitch enabled={inst.isActive} onChange={handleToggleActive} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-dark-500/15 relative">
          <div className="bg-dark-700/60 px-4 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-dark-50">{totalUsers}</p>
            <p className="text-xs text-dark-400 mt-0.5">Total Users</p>
          </div>
          <div className="bg-dark-700/60 px-4 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-emerald-400">{roleCounts.teacher || 0}</p>
            <p className="text-xs text-dark-400 mt-0.5">Teachers</p>
          </div>
          <div className="bg-dark-700/60 px-4 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-blue-400">{roleCounts.student || 0}</p>
            <p className="text-xs text-dark-400 mt-0.5">Students</p>
          </div>
          <div className="bg-dark-700/60 px-4 py-4 text-center">
            <p className="text-2xl font-extrabold font-heading text-orange-400">{roleCounts.pending || 0}</p>
            <p className="text-xs text-dark-400 mt-0.5">Pending</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-dark-700/60 border border-dark-500/25 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center
              ${activeTab === tab.id
                ? 'bg-brand-500/12 text-brand-400'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-600/30'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Role Breakdown */}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-4">User Breakdown by Role</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                  <span className={`text-sm font-medium ${ROLE_COLORS[role] || 'text-dark-300'}`}>
                    {formatRole(role)}
                  </span>
                  <span className="text-lg font-bold font-heading text-dark-50">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-heading">Recent Users</h3>
              <button
                onClick={() => navigate('/dashboard/superadmin/users')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                View All <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {inst.recentUsers?.map(user => (
                <div key={user.id}
                  onClick={() => navigate(`/dashboard/superadmin/users/${user.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-600/25
                    transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center
                      text-xs font-bold text-white shrink-0">
                      {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-100 truncate">{user.name}</p>
                      <p className="text-xs text-dark-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={user.role === 'pending' ? 'warning' : user.isApproved ? 'success' : 'default'}
                      size="sm"
                    >
                      {formatRole(user.role)}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              ))}
              {(!inst.recentUsers || inst.recentUsers.length === 0) && (
                <p className="text-sm text-dark-400 text-center py-4">No users in this institution yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Academics */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          {/* Grades & Sections */}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-1">Grades & Sections</h3>
            <p className="text-xs text-dark-400 mb-4">
              {inst.grades?.length || 0} grades with sections in this institution
            </p>
            {inst.grades?.length > 0 ? (
              <div className="space-y-3">
                {inst.grades.map(grade => (
                  <div key={grade.id} className="p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-400" />
                        <span className="text-sm font-semibold text-dark-100">Grade {grade.name}</span>
                        <Badge variant="default" size="sm">{grade.category}</Badge>
                      </div>
                      <span className="text-xs text-dark-400">{grade.sections.length} section{grade.sections.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {grade.sections.map(section => (
                        <span key={section.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-dark-700/60 border border-dark-500/15 text-xs font-medium text-dark-200">
                          Section {section.name}
                          <span className="text-dark-500">({section._count?.users || 0} students)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">No grades configured yet.</p>
            )}
          </div>

          {/* Subjects */}
          <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
            <h3 className="font-semibold font-heading mb-1">Subjects</h3>
            <p className="text-xs text-dark-400 mb-4">{inst.subjects?.length || 0} subjects</p>
            {inst.subjects?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {inst.subjects.map(subject => (
                  <div key={subject.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-100 truncate">{subject.name}</p>
                      <p className="text-xs text-dark-400">
                        {subject.grade?.name ? `Grade ${subject.grade.name}` : ''}
                        {subject.department?.name ? ` · ${subject.department.name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">No subjects configured yet.</p>
            )}
          </div>

          {/* Departments */}
          {inst.departments?.length > 0 && (
            <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
              <h3 className="font-semibold font-heading mb-4">Departments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inst.departments.map(dept => (
                  <div key={dept.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30 border border-dark-500/10">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-violet-400" />
                      <span className="text-sm font-medium text-dark-100">{dept.name}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-dark-400">
                      <span>{dept._count?.users || 0} users</span>
                      <span>{dept._count?.subjects || 0} subjects</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
