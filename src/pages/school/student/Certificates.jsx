import { useState, useEffect } from 'react'
import CertificateCard from '../../../components/ui/CertificateCard'
import EmptyState from '../../../components/ui/EmptyState'
import { Award } from 'lucide-react'

export default function SchoolStudentCertificates() {
  const [certificates, setCertificates] = useState([])

  useEffect(() => {
    // TODO: Fetch student's certificates from API
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Certificates</h1>
        <p className="text-sm text-dark-200 mt-1.5">Download your earned certificates.</p>
      </div>
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map(cert => (
            <CertificateCard key={cert.id} certificate={cert} onDownload={() => {}} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Award} title="No certificates yet" message="Complete assessments and earn certificates from your teachers." />
      )}
    </div>
  )
}
