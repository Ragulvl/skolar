import { ClipboardCheck } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherAttendance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Mark Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Mark attendance for your classes.</p>
      </div>
      <EmptyState icon={ClipboardCheck} title="Select a class" message="Choose a class from My Classes to mark attendance." />
    </div>
  )
}
