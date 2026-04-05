import { Award } from 'lucide-react'
import EmptyState from '../../../components/ui/EmptyState'

export default function CollegeTeacherCertificates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Certificates</h1>
        <p className="text-sm text-dark-200 mt-1.5">Issue and manage certificates for your students.</p>
      </div>
      <EmptyState icon={Award} title="No certificates" message="Issue certificates to recognize student achievements." />
    </div>
  )
}
