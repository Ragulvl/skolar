import { ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import useAPI from '../../../hooks/useAPI'

export default function SchoolVPAttendance() {
  const { data, loading } = useAPI('/viceprincipal/attendance', { fallback: {} })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Attendance report for your assigned grades.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ClipboardCheck} label="Present" value={loading ? '—' : (data.present || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Absent" value={loading ? '—' : (data.absent || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Percentage" value={loading ? '—' : `${data.percentage || 0}%`} />
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Attendance Breakdown</h3>
        <div className="max-w-xs mx-auto">
          <AttendanceDonut present={data.present || 0} absent={data.absent || 0} late={0} />
        </div>
      </div>
    </div>
  )
}
