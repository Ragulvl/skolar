import { Users } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherStudents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Students</h1>
        <p className="text-sm text-dark-200 mt-1.5">Students across your assigned classes.</p>
      </div>
      <EmptyState icon={Users} title="No students" message="Students will appear once you have classes assigned." />
    </div>
  )
}
