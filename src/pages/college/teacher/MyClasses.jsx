import { BookOpen, Users, ClipboardCheck, FileText, ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherMyClasses() {
  const { data: classes, loading } = useAPI('/teacher/my-classes', { fallback: [] })

  const ownDept = classes.filter(c => c.isOwnDept)
  const crossDept = classes.filter(c => !c.isOwnDept)

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-extrabold font-heading">My Classes</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-dark-700/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-extrabold font-heading">My Classes</h1></div>
        <EmptyState icon={BookOpen} title="No classes assigned"
          message="You don't have any active subject assignments yet. Contact your HOD to get assigned." />
      </div>
    )
  }

  const SubjectCard = ({ cls }) => (
    <Link
      to={cls.isOwnDept ? '/dashboard/college/teacher/dept-view' : `/dashboard/college/teacher/subject/${cls.subjectId}`}
      className="p-5 rounded-2xl bg-dark-700/60 border border-dark-500/25 hover:border-brand-500/30 hover:bg-dark-700/80 transition-all group card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-brand-500/12 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
          <BookOpen className="w-5 h-5 text-brand-400" />
        </div>
        <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-sm font-semibold text-dark-50 mb-1 group-hover:text-brand-300 transition-colors">{cls.subjectName}</h3>
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="w-3 h-3 text-dark-400" />
        <span className="text-xs text-dark-400">{cls.departmentName}</span>
        {!cls.isOwnDept && (
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/20 text-[10px] font-medium text-violet-300">
            Cross-Dept
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-dark-300">
        <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> {cls.attendanceRecords} attendance</span>
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {cls.assessments} assessments</span>
      </div>
    </Link>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Classes</h1>
        <p className="text-sm text-dark-200 mt-1.5">
          {classes.length} subject{classes.length > 1 ? 's' : ''} assigned
          {crossDept.length > 0 && <span className="text-violet-400 ml-2">· {crossDept.length} cross-department</span>}
        </p>
      </div>

      {ownDept.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Own Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ownDept.map(cls => <SubjectCard key={cls.assignmentId} cls={cls} />)}
          </div>
        </div>
      )}

      {crossDept.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            Cross-Department
            <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-[10px] font-bold">
              {crossDept.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {crossDept.map(cls => <SubjectCard key={cls.assignmentId} cls={cls} />)}
          </div>
        </div>
      )}
    </div>
  )
}
