import { BookOpen, Users, GraduationCap, FileText, ClipboardCheck } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import { useMultiAPI } from '../../../hooks/useAPI'

export default function CollegeHODOverview() {
  const { user } = useAuth()

  const { data, loading } = useMultiAPI([
    { url: user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null, key: 'teachers', staleTime: 60_000, fallback: [] },
    { url: user?.institutionId ? `/admin/institutions/${user.institutionId}/stats` : null, key: 'stats', staleTime: 60_000, fallback: {} },
  ].filter(q => q.url))

  const teachers = data.teachers || []
  const s = data.stats || {}
  const stats = {
    teachers: teachers.length,
    students: s.students || 0,
    assessments: s.assessments || 0,
    attendance: '—',
  }

  const columns = [
    { header: 'Teacher', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Subject', accessor: 'subject', cell: (row) => <Badge variant="violet" size="sm">{row.subject}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Department Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{user?.institution?.name || 'Your department at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Teachers" value={stats.teachers.toString()} />
        <StatCard icon={GraduationCap} label="Students" value={stats.students.toString()} />
        <StatCard icon={FileText} label="Assessments" value={stats.assessments.toString()} />
        <StatCard icon={ClipboardCheck} label="Avg Attendance" value={stats.attendance} />
      </div>

      <div>
        <DataTable columns={columns} data={teachers} searchPlaceholder="Search teachers..." />
      </div>
    </div>
  )
}
