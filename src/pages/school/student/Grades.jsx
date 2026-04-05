import { useState, useEffect } from 'react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'

export default function SchoolStudentGrades() {
  const [results, setResults] = useState([])

  useEffect(() => {
    // TODO: Fetch student's assessment results from API
  }, [])

  const columns = [
    { header: 'Assessment', accessor: 'title', cell: (row) => (
      <div>
        <p className="font-medium text-dark-50">{row.title}</p>
        <p className="text-xs text-dark-400">{row.subject}</p>
      </div>
    )},
    { header: 'Score', accessor: 'score', cell: (row) => (
      <span className="font-medium text-dark-50">{row.score}/{row.total}</span>
    )},
    { header: 'Percentage', sortable: true, accessor: 'score', cell: (row) => {
      const pct = row.total ? Math.round((row.score / row.total) * 100) : 0
      return <Badge variant={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'} size="sm">{pct}%</Badge>
    }},
    { header: 'Grade', accessor: 'grade', cell: (row) => (
      <span className="font-bold text-dark-50">{row.grade}</span>
    )},
    { header: 'Date', accessor: 'date', cell: (row) => (
      <span className="text-dark-300">{row.date ? new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Grades</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your assessment results and scores.</p>
      </div>
      <DataTable columns={columns} data={results} searchPlaceholder="Search assessments..." />
    </div>
  )
}
