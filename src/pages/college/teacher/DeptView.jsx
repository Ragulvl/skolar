import { Building2, Users, BookOpen, ClipboardCheck, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import useAPI from '../../../hooks/useAPI'

export default function DeptView() {
  const navigate = useNavigate()
  const { data, loading } = useAPI('/teacher/dept-view', { fallback: {} })

  const dept = data?.department || {}
  const students = data?.students || []
  const teachers = data?.teachers || []
  const subjects = data?.subjects || []
  const att = data?.attendance || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/25 hover:bg-dark-600/60 transition-all">
          <ArrowLeft className="w-4 h-4 text-dark-300" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold font-heading">{dept.name || 'My Department'}</h1>
          <p className="text-sm text-dark-200 mt-0.5">Full department view — this is your primary department</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Subjects" value={loading ? '—' : subjects.length.toString()} />
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : teachers.length.toString()} />
        <StatCard icon={Users} label="Students" value={loading ? '—' : students.length.toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance" value={loading ? '—' : `${att.percentage || 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Subjects ({subjects.length})</h3>
          {subjects.length > 0 ? (
            <div className="space-y-3">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/12 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark-50">{s.name}</p>
                    <p className="text-xs text-dark-400">{s.assignedTeachers?.join(', ') || 'No teacher assigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-dark-500">No subjects</p>}
        </div>

        {/* Teachers */}
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Teachers ({teachers.length})</h3>
          {teachers.length > 0 ? (
            <div className="space-y-3">
              {teachers.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                    {t.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-100">{t.name}</p>
                    <p className="text-xs text-dark-400">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-dark-500">No teachers</p>}
        </div>
      </div>

      {/* Students */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Students ({students.length})</h3>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.slice(0, 18).map(s => (
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
            {students.length > 18 && (
              <p className="text-xs text-dark-500 text-center col-span-3 py-2">+{students.length - 18} more students</p>
            )}
          </div>
        ) : <p className="text-sm text-dark-500">No students</p>}
      </div>
    </div>
  )
}
