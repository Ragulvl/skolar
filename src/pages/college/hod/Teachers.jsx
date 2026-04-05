import { Users, BookOpen, Building2 } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import useAPI from '../../../hooks/useAPI'

export default function CollegeHODTeachers() {
  const { data, loading } = useAPI('/hod/teachers', { fallback: [] })
  const teachers = data || []

  const columns = [
    { header: 'Teacher', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Assigned Subjects', cell: (row) => {
      const assignments = row.teacherAssignments || []
      if (assignments.length === 0) {
        return <span className="text-xs text-amber-400 italic">⚠ No subjects assigned</span>
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {assignments.map(a => (
            <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              <BookOpen className="w-3 h-3" />
              {a.subject.name}
              {a.subject.departmentId !== row.departmentId && (
                <span className="text-[10px] text-dark-500 ml-0.5">(cross-dept)</span>
              )}
            </span>
          ))}
        </div>
      )
    }},
    { header: 'Departments', cell: (row) => {
      const depts = row.teacherDeptAssignments || []
      if (depts.length === 0) return <span className="text-xs text-dark-500">Primary only</span>
      return (
        <div className="flex flex-wrap gap-1">
          {depts.map(d => (
            <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dark-600/40 text-[11px] text-dark-300">
              <Building2 className="w-3 h-3" />
              {d.department.name}
            </span>
          ))}
        </div>
      )
    }},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Department Teachers</h1>
        <p className="text-sm text-dark-200 mt-1.5">
          Teachers and their subject assignments.
          {teachers.filter(t => (t.teacherAssignments || []).length === 0).length > 0 && (
            <span className="text-amber-400 ml-2">
              ⚠ {teachers.filter(t => (t.teacherAssignments || []).length === 0).length} teacher(s) without subjects
            </span>
          )}
        </p>
      </div>
      <DataTable columns={columns} data={teachers} searchPlaceholder="Search teachers..." />
    </div>
  )
}
