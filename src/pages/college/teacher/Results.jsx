import { BarChart3 } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherResults() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Results</h1>
        <p className="text-sm text-dark-200 mt-1.5">View assessment results for your students.</p>
      </div>
      <EmptyState icon={BarChart3} title="No results yet" message="Results will appear once students submit assessments." />
    </div>
  )
}
