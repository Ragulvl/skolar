import { useState } from 'react'
import { Layers, Users, GraduationCap, ClipboardCheck, BookOpen, FileText, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import { useAuth } from '../../../context/AuthContext'
import { useMultiAPI, invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

const schoolRoles = [
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export default function SchoolPrincipalOverview() {
  const { user } = useAuth()
  const institutionId = user?.institutionId
  const institutionName = user?.institution?.name || '—'
  const institutionCode = user?.institution?.code || '—'

  const { data, loading } = useMultiAPI([
    { url: institutionId ? `/school/grades/${institutionId}` : null, key: 'grades', staleTime: 60_000, fallback: [] },
    { url: institutionId ? `/admin/institutions/${institutionId}/stats` : null, key: 'stats', staleTime: 60_000, fallback: {} },
    { url: institutionId ? `/admin/pending/${institutionId}` : null, key: 'pending', staleTime: 30_000, fallback: [] },
  ].filter(q => q.url))

  const grades = data.grades || []
  const s = data.stats || {}
  const stats = {
    grades: grades.length,
    teachers: s.teachers || 0,
    students: s.students || 0,
    pending: s.pending || 0,
  }
  const [pendingUsers, setPendingUsers] = useState(data.pending || [])
  const [selectedRoles, setSelectedRoles] = useState({})

  const handleApprove = async (userId, role) => {
    try {
      await api.patch('/admin/approve-user', { userId, role })
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      invalidateCache('/admin')
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">School Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{institutionName} · {institutionCode}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Grades" value={loading ? '—' : stats.grades.toString()} />
        <StatCard icon={Users} label="Total Teachers" value={loading ? '—' : stats.teachers.toString()} />
        <StatCard icon={GraduationCap} label="Total Students" value={loading ? '—' : stats.students.toString()} />
        <StatCard icon={ClipboardCheck} label="Pending" value={loading ? '—' : stats.pending.toString()} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/dashboard/school/principal/grades"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
            bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
          <Layers className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
          <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">Grades</span>
        </Link>
        <Link to="/dashboard/school/principal/teachers"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
            bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
          <Users className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
          <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">Teachers</span>
        </Link>
        <Link to="/dashboard/school/principal/assessments"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
            bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
          <FileText className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
          <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">Assessments</span>
        </Link>
        <Link to="/dashboard/school/principal/pending"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]
            bg-dark-700/40 border-dark-500/20 hover:border-brand-500/30 hover:bg-brand-500/5 group">
          <UserCheck className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
          <span className="text-sm font-medium text-dark-200 group-hover:text-dark-50 transition-colors">Approvals</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Today's Attendance</h3>
          <AttendanceDonut present={0} absent={0} late={0} />
        </div>

        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-heading">Pending Approvals</h3>
            <Badge variant="warning" size="sm" dot>{pendingUsers.length} pending</Badge>
          </div>
          {pendingUsers.length > 0 ? (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-dark-600/40 rounded-xl border border-dark-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 text-sm font-bold">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-50">{u.name}</p>
                      <p className="text-xs text-dark-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="select-styled text-xs px-2 py-1"
                      value={selectedRoles[u.id] || ''}
                      onChange={e => setSelectedRoles(prev => ({ ...prev, [u.id]: e.target.value }))}>
                      <option value="">Assign role…</option>
                      {schoolRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button onClick={() => handleApprove(u.id, selectedRoles[u.id])}
                      disabled={!selectedRoles[u.id]}
                      className="px-3 py-1 text-xs rounded-lg gradient-brand text-white font-medium disabled:opacity-40">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-6">No pending approvals.</p>
          )}
        </div>
      </div>
    </div>
  )
}
