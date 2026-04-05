import { BookOpen, Users, GraduationCap, FileText, ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'

export default function CollegeHODOverview() {
  const { user } = useAuth()
  const { data, loading } = useAPI('/hod/overview', { fallback: {} })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Department Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{user?.institution?.name || 'Your department at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : (data.teachers || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (data.students || 0).toString()} />
        <StatCard icon={BookOpen} label="Subjects" value={loading ? '—' : (data.subjects || 0).toString()} />
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : (data.assessments || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Attendance" value={loading ? '—' : `${data.attendance || 0}%`} />
      </div>
    </div>
  )
}
