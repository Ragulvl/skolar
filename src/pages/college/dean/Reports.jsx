import { BarChart3, FileText } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import useAPI from '../../../hooks/useAPI'

export default function CollegeDeanReports() {
  const { data, loading } = useAPI('/dean/reports', { fallback: {} })
  const att = data.attendance || {}
  const assess = data.assessments || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Performance reports for your departments.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Attendance %" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={FileText} label="Avg Score" value={loading ? '—' : (assess.avgScore || 0).toString()} />
        <StatCard icon={FileText} label="Submissions" value={loading ? '—' : (assess.totalResults || 0).toString()} />
        <StatCard icon={FileText} label="Att Records" value={loading ? '—' : (att.total || 0).toString()} />
      </div>
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Attendance Overview</h3>
        <div className="max-w-xs mx-auto"><AttendanceDonut present={att.present || 0} absent={att.absent || 0} late={0} /></div>
      </div>
    </div>
  )
}
