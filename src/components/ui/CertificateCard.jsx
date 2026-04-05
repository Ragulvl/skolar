import { Download, Award } from 'lucide-react'

export default function CertificateCard({ certificate, onDownload }) {
  return (
    <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden card-hover group">
      {/* Preview */}
      <div className="relative h-44 bg-gradient-to-br from-brand-500/8 via-violet-500/8 to-transparent
        flex items-center justify-center border-b border-dark-500/20">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-brand-subtle flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7 text-brand-400" />
          </div>
          <p className="text-sm font-heading font-bold text-dark-50">Certificate of Excellence</p>
          <p className="text-xs text-dark-300 mt-1.5">{certificate.subject}</p>
        </div>
        <div className="absolute inset-0 bg-dark-900/70 opacity-0 group-hover:opacity-100
          flex items-center justify-center transition-all duration-300">
          <button
            onClick={onDownload}
            className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold
              flex items-center gap-2 shadow-glow hover:shadow-glow-lg transition-all transform scale-90 group-hover:scale-100"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-sm font-semibold text-dark-50">{certificate.studentName}</p>
        <p className="text-xs text-dark-300 mt-1">
          Issued on {new Date(certificate.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-xs text-dark-400 mt-0.5">by {certificate.issuedBy}</p>
      </div>
    </div>
  )
}
