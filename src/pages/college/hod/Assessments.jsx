import { FileText } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeHODAssessments() {
  const { data: assessments, loading } = useAPI('/hod/assessments', { fallback: [] })
  const columns = [
    { header: 'Title', accessor: 'title', cell: (row) => (
      <div>
        <p className="font-medium text-dark-50">{row.title}</p>
        <p className="text-xs text-dark-400">by {row.creator?.name}</p>
      </div>
    )},
    { header: 'Subject', cell: (row) => <Badge variant="violet" size="sm">{row.subject?.name || '—'}</Badge> },
    { header: 'Submissions', cell: (row) => row._count?.results || 0 },
    { header: 'Max Score', accessor: 'maxScore' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">All assessments in your department.</p>
      </div>
      {assessments.length > 0 ? <DataTable columns={columns} data={assessments} searchPlaceholder="Search assessments..." /> : (
        <EmptyState icon={FileText} title={loading ? 'Loading...' : 'No assessments'} message="No assessments have been created yet." />
      )}
    </div>
  )
}
