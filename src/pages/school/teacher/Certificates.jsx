import { useState } from 'react'
import { Award, Download } from 'lucide-react'
import FormInput from '../../../components/ui/FormInput'
import CertificateCard from '../../../components/ui/CertificateCard'

const issuedCerts = [
  { id: '1', studentName: 'Aarav Sharma', subject: 'Mathematics Excellence', issuedAt: '2024-03-15', issuedBy: 'Ananya Reddy' },
  { id: '2', studentName: 'Diya Patel', subject: 'Science Achievement', issuedAt: '2024-04-20', issuedBy: 'Ananya Reddy' },
]

export default function SchoolTeacherCertificates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Issue Certificates</h1>
        <p className="text-sm text-dark-200 mt-1.5">Generate and manage student certificates.</p>
      </div>

      {/* Issue Form */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Generate New Certificate</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput label="Student" type="select">
            <option value="">Select student</option>
            <option value="1">Aarav Sharma</option>
            <option value="2">Diya Patel</option>
            <option value="3">Rohan Kumar</option>
          </FormInput>
          <FormInput label="Subject/Achievement" placeholder="e.g., Mathematics Excellence" />
          <div className="flex items-end">
            <button className="w-full px-4 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:shadow-glow transition-all">
              <Award className="w-4 h-4" /> Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* Issued Certificates */}
      <div>
        <h3 className="font-semibold font-heading mb-4">Previously Issued</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {issuedCerts.map(cert => (
            <CertificateCard key={cert.id} certificate={cert} onDownload={() => {}} />
          ))}
        </div>
      </div>
    </div>
  )
}
