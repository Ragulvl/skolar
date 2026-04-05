import { Layers, Users, GraduationCap, ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function SchoolVPOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/viceprincipal/overview', { fallback: {} })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Vice Principal Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{user?.institution?.name || 'Your assigned grades at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Assigned Grades" value={loading ? '—' : (data.grades || 0).toString()} />
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (data.teachers || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (data.students || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance %" value={loading ? '—' : `${data.attendance || 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Attendance Summary</h3>
          <AttendanceDonut present={parseInt(data.attendance || 0)} absent={100 - parseInt(data.attendance || 0)} late={0} />
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Quick Info</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Grades Assigned', value: data.grades || 0 },
              { label: 'Students in Your Grades', value: data.students || 0 },
              { label: 'Teachers in Your Grades', value: data.teachers || 0 },
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
