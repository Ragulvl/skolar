import { BookOpen, Users, ClipboardCheck, FileText, ArrowLeft, Calendar } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolTeacherClassDetail() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Get teacher info to find the matching assignment
  const { data: allTeachers } = useAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  // Find the current teacher's assignment matching this ID
  const myClass = (allTeachers || []).find(t => t.id === assignmentId) ||
    (allTeachers || []).find(t => t.id === user?.id)
  
  // Fetch students for the section
  const sectionId = myClass?.sectionId
  const { data: students, loading: studentsLoading } = useAPI(
    sectionId ? `/school/students/${sectionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  // Fetch assessments created by this teacher
  const { data: assessments, loading: assessmentsLoading } = useAPI(
    '/assessment/list',
    { fallback: [], staleTime: 30_000 }
  )

  // Filter assessments to this teacher's subject
  const myAssessments = (assessments || []).filter(a =>
    a.createdBy === user?.id || a.creator?.id === user?.id
  ).slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/school/teacher/classes')}
          className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 transition-all">
          <ArrowLeft className="w-4 h-4 text-dark-300" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold font-heading">
            {myClass?.subject || 'Class Details'}
          </h1>
          <p className="text-sm text-dark-200 mt-0.5">
            {myClass ? `Grade ${myClass.grade} · Section ${myClass.section}` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Subject" value={myClass?.subject || '—'} />
        <StatCard icon={Users} label="Students" value={studentsLoading ? '—' : students.length.toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance" value="—" />
        <StatCard icon={FileText} label="Assessments" value={assessmentsLoading ? '—' : myAssessments.length.toString()} />
      </div>

      {/* Students List */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" /> Students ({students.length})
        </h3>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/12 flex items-center justify-center text-xs font-bold text-emerald-300">
                  {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">{s.name}</p>
                  <p className="text-xs text-dark-400 truncate">{s.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 text-center py-4">
            {studentsLoading ? 'Loading students...' : 'No students in this section.'}
          </p>
        )}
      </div>

      {/* Recent Assessments */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" /> My Assessments
        </h3>
        {myAssessments.length > 0 ? (
          <div className="space-y-3">
            {myAssessments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/12 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-50">{a.title}</p>
                    <p className="text-xs text-dark-400">{a.type} · {a._count?.results || 0} submissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={new Date(a.dueDate) > new Date() ? 'warning' : 'neutral'} size="sm">
                    {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 text-center py-4">No assessments created yet.</p>
        )}
      </div>
    </div>
  )
}
