import { BarChart3, FileText, Users } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolPrincipalReports() {
  const { user } = useAuth()
  const { data: report, loading } = useAPI(
    user?.institutionId ? `/admin/reports/${user.institutionId}` : null,
    { fallback: {} }
  )

  const att = report?.attendance || {}
  const assess = report?.assessments || {}
  const users = report?.users || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">School Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Overall school performance reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Attendance %" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={FileText} label="Avg Score" value={loading ? '—' : (assess.avgScore || 0).toString()} />
        <StatCard icon={Users} label="Students" value={loading ? '—' : (users.students || 0).toString()} />
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (users.teachers || 0).toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Attendance Overview</h3>
          <AttendanceDonut present={att.present || 0} absent={att.absent || 0} late={0} />
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Performance Summary</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Attendance Records', value: att.total || 0 },
              { label: 'Present', value: att.present || 0 },
              { label: 'Absent', value: att.absent || 0 },
              { label: 'Assessment Avg Score', value: `${assess.avgScore || 0}/100` },
              { label: 'Total Submissions', value: assess.totalResults || 0 },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-500/15 last:border-0">
                <span className="text-sm text-dark-300">{m.label}</span>
                <span className="text-sm font-semibold text-dark-50">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
