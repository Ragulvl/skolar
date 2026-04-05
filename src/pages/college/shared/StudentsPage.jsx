import { GraduationCap } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'

export default function StudentsPage() {
  const { data: students, loading } = useAPI('/college-admin/students', { fallback: [] })

  const columns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/12 flex items-center justify-center text-xs font-bold text-emerald-300">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Department', cell: (row) => row.department?.name || <span className="text-dark-500">—</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">All Students</h1>
        <p className="text-sm text-dark-200 mt-1.5">Every student across all departments.</p>
      </div>
      <DataTable columns={columns} data={students || []} searchPlaceholder="Search students..." />
    </div>
  )
}
