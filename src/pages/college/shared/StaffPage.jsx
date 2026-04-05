import { Users, UserCog } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'

const ROLE_LABELS = {
  principal: 'Principal', vice_principal: 'Vice Principal',
  dean: 'Dean', hod: 'HOD', teacher: 'Teacher',
}

export default function StaffPage() {
  const { data: staff, loading } = useAPI('/college-admin/staff', { fallback: [] })

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
    { header: 'Role', cell: (row) => (
      <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-300">
        {ROLE_LABELS[row.role] || row.role}
      </span>
    )},
    { header: 'Department', cell: (row) => row.department?.name || <span className="text-dark-500">—</span> },
    { header: 'Subjects', cell: (row) => {
      const subs = row.teacherAssignments || []
      if (subs.length === 0) return <span className="text-dark-500">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {subs.slice(0, 3).map(a => (
            <span key={a.id} className="px-2 py-0.5 rounded-md bg-dark-600/40 text-xs text-dark-300">{a.subject.name}</span>
          ))}
          {subs.length > 3 && <span className="text-xs text-dark-500">+{subs.length - 3}</span>}
        </div>
      )
    }},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">All Staff</h1>
        <p className="text-sm text-dark-200 mt-1.5">Staff across all departments and roles.</p>
      </div>
      <DataTable columns={columns} data={staff || []} searchPlaceholder="Search staff..." />
    </div>
  )
}
