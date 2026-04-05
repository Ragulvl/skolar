import { UserCog } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolPrincipalTeachers() {
  const { user } = useAuth()

  const { data: teachers } = useAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  const columns = [
    {
      header: 'Teacher', accessor: 'name', cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
            {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-dark-50">{row.name}</p>
            <p className="text-xs text-dark-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject', cell: (row) => <Badge variant="brand" size="sm">{row.subject}</Badge> },
    { header: 'Grade', accessor: 'grade', cell: (row) => <span className="text-dark-100">Grade {row.grade}</span> },
    { header: 'Section', accessor: 'section', cell: (row) => <Badge variant="neutral" size="sm">{row.section}</Badge> },
    {
      header: 'Actions', sortable: false, cell: () => (
        <button className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
          <UserCog className="w-3 h-3" /> Reassign
        </button>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Teachers</h1>
        <p className="text-sm text-dark-200 mt-1.5">View and manage teacher assignments.</p>
      </div>
      <DataTable columns={columns} data={teachers} searchPlaceholder="Search teachers..." />
    </div>
  )
}
