import { useState } from 'react'
import { Layers, Users, GraduationCap, ClipboardCheck, Clock } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import PendingApprovalCard from '../../../components/ui/PendingApprovalCard'
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

  const handleApprove = async (userId, role) => {
    try {
      await api.patch('/admin/approve-user', { userId, role })
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => ({ ...prev, pending: prev.pending - 1 }))
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
                <PendingApprovalCard key={u.id} user={u} roles={schoolRoles}
                  onApprove={(role) => handleApprove(u.id, role)} onReject={() => {}} />
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
