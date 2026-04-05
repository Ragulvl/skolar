import { Users } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function SchoolVPTeachers() {
  const { data: teachers, loading } = useAPI('/viceprincipal/teachers', { fallback: [] })

  const columns = [
    { header: 'Teacher', accessor: 'name', cell: (row) => (
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
    { header: 'Department', accessor: 'department', cell: (row) => (
      <span className="text-sm text-dark-200">{row.department?.name || '—'}</span>
    )},
  ]

  if (teachers.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Teachers</h1>
          <p className="text-sm text-dark-200 mt-1.5">Teachers in your assigned grades.</p>
        </div>
        <EmptyState icon={Users} title="No teachers found" message="No teachers assigned in your grades yet." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Teachers</h1>
        <p className="text-sm text-dark-200 mt-1.5">Teachers in your assigned grades.</p>
      </div>
      <DataTable columns={columns} data={teachers} searchPlaceholder="Search teachers..." />
    </div>
  )
}
