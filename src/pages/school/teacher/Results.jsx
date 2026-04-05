import { FileText, BarChart3 } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function SchoolTeacherResults() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Results</h1>
        <p className="text-sm text-dark-200 mt-1.5">View and manage assessment results for your students.</p>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Assessment Results</h3>
        <EmptyState icon={BarChart3} title="No results yet"
          message="Results will appear here once students submit your assessments." />
      </div>
    </div>
  )
}
