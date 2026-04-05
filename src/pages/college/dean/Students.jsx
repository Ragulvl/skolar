import { GraduationCap } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'

export default function CollegeDeanStudents() {
  const { data: students } = useAPI('/dean/students', { fallback: [] })
  const columns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Department', cell: (row) => row.department?.name || '—' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Students</h1>
        <p className="text-sm text-dark-200 mt-1.5">Students across your departments.</p>
      </div>
      <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />
    </div>
  )
}
