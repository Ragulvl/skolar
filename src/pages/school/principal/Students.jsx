import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolPrincipalStudents() {
  const { user } = useAuth()

  const { data: students } = useAPI(
    user?.institutionId ? `/school/students-by-institution/${user.institutionId}` : null,
    { fallback: [], staleTime: 60_000 }
  )

  const columns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-500/15 flex items-center justify-center text-xs font-bold text-brand-400">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Grade', accessor: 'grade', cell: (row) => <span>Grade {row.grade}</span> },
    { header: 'Section', accessor: 'section', cell: (row) => <Badge variant="neutral" size="sm">{row.section}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Students</h1>
        <p className="text-sm text-dark-200 mt-1.5">View all students across grades and sections.</p>
      </div>
      <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />
    </div>
  )
}
