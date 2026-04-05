import { FileText } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import useAPI from '../../../hooks/useAPI'

export default function SchoolVPReports() {
  const { data, loading } = useAPI('/viceprincipal/reports', { fallback: {} })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Reports for your assigned grades.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Present" value={loading ? '—' : (data.present || 0).toString()} />
        <StatCard icon={FileText} label="Absent" value={loading ? '—' : (data.absent || 0).toString()} />
        <StatCard icon={FileText} label="Attendance %" value={loading ? '—' : `${data.percentage || 0}%`} />
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Summary</h3>
        <div className="space-y-4">
          {[
            { label: 'Total Records', value: data.total || 0 },
            { label: 'Present', value: data.present || 0 },
            { label: 'Absent', value: data.absent || 0 },
            { label: 'Attendance Rate', value: `${data.percentage || 0}%` },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-dark-500/15 last:border-0">
              <span className="text-sm text-dark-300">{item.label}</span>
              <span className="text-sm font-semibold text-dark-50">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
