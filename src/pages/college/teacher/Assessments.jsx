import { FileText } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherAssessments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
        <p className="text-sm text-dark-200 mt-1.5">Create and manage assessments for your subjects.</p>
      </div>
      <EmptyState icon={FileText} title="No assessments"
        message="Create assessments for your subjects to evaluate student performance." />
    </div>
  )
}
