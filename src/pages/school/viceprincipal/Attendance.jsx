import { ClipboardCheck, TrendingUp, Users } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import useAPI from '../../../hooks/useAPI'

export default function SchoolVPAttendance() {
  const { data, loading } = useAPI('/viceprincipal/attendance', { fallback: {} })

  const present = data?.present || 0
  const absent = data?.absent || 0
  const total = data?.total || 0
  const percentage = data?.percentage || '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Attendance report for your assigned grades.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : present.toString()} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : absent.toString()} />
        <StatCard icon={TrendingUp} label="Percentage" value={loading ? '—' : `${percentage}%`} />
        <StatCard icon={Users} label="Total Records" value={loading ? '—' : total.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Attendance Breakdown</h3>
          <div className="max-w-xs mx-auto">
            <AttendanceDonut present={present} absent={absent} late={0} />
          </div>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Key Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Attendance Records', value: total },
              { label: 'Present Count', value: present },
              { label: 'Absent Count', value: absent },
              { label: 'Attendance Rate', value: `${percentage}%` },
              { label: 'Present-to-Absent Ratio', value: absent > 0 ? `${(present / absent).toFixed(1)}:1` : `${present}:0` },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-500/15 last:border-0">
                <span className="text-sm text-dark-300">{item.label}</span>
                <span className="text-sm font-semibold text-dark-50">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
