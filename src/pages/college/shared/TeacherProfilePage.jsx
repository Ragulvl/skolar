import { useParams } from 'react-router-dom'
import { BookOpen, ClipboardCheck, FileText, Calendar, TrendingUp } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Breadcrumb from '../../../components/ui/Breadcrumb'
import useAPI from '../../../hooks/useAPI'

export default function TeacherProfilePage({ basePath }) {
  const { deptId, teacherId } = useParams()
  const { data, loading } = useAPI(`/college-admin/departments/${deptId}/teachers/${teacherId}`, { fallback: {} })
  const deptDetail = useAPI(`/college-admin/departments/${deptId}`, { fallback: {} })
  const deptName = deptDetail.data?.name || '...'

  const assigns = data?.teacherAssignments || []

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Departments', to: `${basePath}/departments` },
        { label: deptName, to: `${basePath}/departments/${deptId}` },
        { label: 'Teachers', to: `${basePath}/departments/${deptId}` },
        { label: data?.name || '...' },
      ]} />

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-xl font-bold text-white">
          {data?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold font-heading">{data?.name || 'Teacher'}</h1>
          <p className="text-sm text-dark-300 mt-0.5">{data?.email}</p>
          <p className="text-xs text-dark-400 mt-1">{data?.department?.name || 'No department'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Subjects" value={loading ? '—' : assigns.length.toString()} />
        <StatCard icon={ClipboardCheck} label="Days Marked" value={loading ? '—' : (data.attendanceDays || 0).toString()} />
        <StatCard icon={FileText} label="Assessments Created" value={loading ? '—' : (data.assessmentsCreated || 0).toString()} />
        <StatCard icon={Calendar} label="Last Marked" value={loading ? '—' :
          data.lastMarked ? new Date(data.lastMarked).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
        />
      </div>

      {/* Assigned subjects */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Assigned Subjects</h3>
        {assigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assigns.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-500/15">
                <div className="w-9 h-9 rounded-lg bg-violet-500/12 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-100">{a.subject.name}</p>
                  <p className="text-xs text-dark-400">{a.subject.department?.name || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 italic">No subjects assigned</p>
        )}
      </div>

      {/* Attendance history */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Attendance Submission History</h3>
        {(data?.attendanceHistory || []).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.attendanceHistory.slice(0, 21).map(d => (
              <div key={d.date} className="text-center p-2 rounded-lg bg-dark-800/30 border border-dark-500/10">
                <p className="text-xs text-dark-400">
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm font-bold text-success mt-0.5">{d.records} rec</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 italic">No attendance records yet</p>
        )}
      </div>

      {/* Assessments */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Assessments Created</h3>
        {(data?.assessments || []).length > 0 ? (
          <div className="space-y-2">
            {data.assessments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div>
                  <p className="text-sm font-medium text-dark-100">{a.title}</p>
                  <p className="text-xs text-dark-400">{a.subject.name} · {a.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-dark-400">{a._count.results} results</p>
                  <p className="text-xs text-dark-500">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 italic">No assessments created yet</p>
        )}
      </div>
    </div>
  )
}
