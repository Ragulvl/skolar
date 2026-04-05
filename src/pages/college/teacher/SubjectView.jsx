import { BookOpen, Users, ClipboardCheck, ArrowLeft, FileText } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import useAPI from '../../../hooks/useAPI'

export default function SubjectView() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useAPI(`/teacher/subject/${subjectId}`, { fallback: {} })

  const subject = data?.subject || {}
  const students = data?.students || []
  const myAtt = data?.myAttendance || {}
  const myAssessments = data?.myAssessments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 transition-all">
          <ArrowLeft className="w-4 h-4 text-dark-300" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold font-heading">{subject.name || 'Subject'}</h1>
          <p className="text-sm text-dark-200 mt-0.5">
            {subject.departmentName} <span className="text-amber-400 text-xs ml-1">CROSS-DEPT • Subject-only view</span>
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-sm text-amber-300">
          ⚠️ You are viewing a cross-department subject. You can only see your own attendance and assessment data for this subject.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="My Attendance" value={loading ? '—' : myAtt.total?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : myAtt.present?.toString() || '0'} />
        <StatCard icon={FileText} label="My Assessments" value={loading ? '—' : myAssessments.length.toString()} />
        <StatCard icon={Users} label="Students" value={loading ? '—' : students.length.toString()} />
      </div>

      {/* My Assessments for this subject */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">My Assessments</h3>
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
                    <p className="text-xs text-dark-400">{a.type} • {a.resultsCount} submissions</p>
                  </div>
                </div>
                <span className="text-xs text-dark-500">
                  {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 text-center py-4">No assessments created for this subject</p>
        )}
      </div>

      {/* Students in that dept */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Students ({students.length})</h3>
        <p className="text-xs text-dark-400 mb-3">Students in this department available for attendance marking</p>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.slice(0, 12).map(s => (
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
        ) : <p className="text-sm text-dark-500">No students</p>}
      </div>
    </div>
  )
}
