import { BookOpen, Users, ClipboardCheck, FileText, Building2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeTeacherOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading } = useAPI('/teacher/dashboard', { fallback: {} })

  const stats = data?.stats || {}
  const ownDeptSubjects = data?.ownDeptSubjects || []
  const crossDeptSubjects = data?.crossDeptSubjects || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Teacher Dashboard</h1>
        <p className="text-sm text-dark-200 mt-1.5">Welcome, {user?.name?.split(' ')[0] || 'Teacher'} 👋</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Subjects" value={loading ? '—' : stats.totalSubjects?.toString() || '0'} />
        <StatCard icon={Users} label="Dept Students" value={loading ? '—' : stats.deptStudents?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Attendance Marked" value={loading ? '—' : stats.attendanceMarked?.toString() || '0'} />
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : stats.assessmentsCreated?.toString() || '0'} />
      </div>

      {/* Own Dept Subjects — Full Dept View available */}
      {ownDeptSubjects.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold font-heading">Own Department Subjects</h3>
              <p className="text-xs text-dark-400 mt-1">You have full department view access for these</p>
            </div>
            <button onClick={() => navigate('/dashboard/college/teacher/dept-view')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-all">
              <Eye className="w-4 h-4" /> Full Dept View
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownDeptSubjects.map((s) => (
              <div key={s.assignmentId} className="p-4 rounded-xl bg-dark-800/40 border border-brand-500/15 card-hover">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/12 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-dark-50 text-sm">{s.subjectName}</p>
                    <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {s.departmentName} <span className="text-brand-400 text-[10px] ml-1">OWN DEPT</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Dept Subjects — Subject-only view */}
      {crossDeptSubjects.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="font-semibold font-heading">Cross-Department Subjects</h3>
            <p className="text-xs text-dark-400 mt-1">Subject-only view — you can only see your subject data in these departments</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crossDeptSubjects.map((s) => (
              <div key={s.assignmentId} className="p-4 rounded-xl bg-dark-800/40 border border-amber-500/15 card-hover cursor-pointer"
                onClick={() => navigate(`/dashboard/college/teacher/subject/${s.subjectId}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/12 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-dark-50 text-sm">{s.subjectName}</p>
                    <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {s.departmentName} <span className="text-amber-400 text-[10px] ml-1">CROSS DEPT</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ownDeptSubjects.length === 0 && crossDeptSubjects.length === 0 && !loading && (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <BookOpen className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No subjects assigned yet.</p>
          <p className="text-xs text-dark-500 mt-1">Contact your HOD or Dean to get assigned to subjects.</p>
        </div>
      )}
    </div>
  )
}
