import { Users } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'

export default function CollegeDeanStaff() {
  const { data: staff } = useAPI('/dean/staff', { fallback: [] })
  const columns = [
    { header: 'Name', accessor: 'name', cell: (row) => (
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
    { header: 'Role', accessor: 'role', cell: (row) => <Badge variant="violet" size="sm">{row.role.replace(/_/g, ' ')}</Badge> },
    { header: 'Department', cell: (row) => row.department?.name || '—' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Staff</h1>
        <p className="text-sm text-dark-200 mt-1.5">HODs and teachers in your departments.</p>
      </div>
      <DataTable columns={columns} data={staff} searchPlaceholder="Search staff..." />
    </div>
  )
}
