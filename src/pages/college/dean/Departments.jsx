import { BookOpen } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeDeanDepartments() {
  const { data: depts, loading } = useAPI('/dean/departments', { fallback: [] })
  const columns = [
    { header: 'Department', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/12 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-violet-400" />
        </div>
        <span className="font-medium text-dark-50">{row.name}</span>
      </div>
    )},
    { header: 'HOD', cell: (row) => row.hod?.name || '—' },
    { header: 'Teachers', accessor: 'teachers' },
    { header: 'Subjects', accessor: 'subjects' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Departments</h1>
        <p className="text-sm text-dark-200 mt-1.5">Departments you oversee as Dean.</p>
      </div>
      {depts.length > 0 ? <DataTable columns={columns} data={depts} /> : (
        <EmptyState icon={BookOpen} title={loading ? 'Loading...' : 'No departments'} message="No departments assigned to you as Dean." />
      )}
    </div>
  )
}
