import { Award } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentCertificates() {
  const { data, loading } = useAPI('/student/certificates', { fallback: [] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Certificates</h1>
        <p className="text-sm text-dark-200 mt-1.5">Certificates of excellence you've earned.</p>
      </div>

      {(data || []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(c => (
            <div key={c.id} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/12 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-dark-50">{c.title}</p>
                  <p className="text-xs text-dark-400">{c.subject?.name || 'General'}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-dark-500">
                <span>Issued by: {c.issuer?.name || '—'}</span>
                <span>{new Date(c.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-dark-700/60 border border-dark-500/25 rounded-2xl">
          <Award className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No certificates earned yet. Keep studying! 📚</p>
        </div>
      )}
    </div>
  )
}
