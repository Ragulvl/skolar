import { useParams, Link } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, ClipboardCheck, UserCog, Crown, Building2 } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Breadcrumb from '../../../components/ui/Breadcrumb'
import DataTable from '../../../components/ui/DataTable'
import useAPI from '../../../hooks/useAPI'
import { useAuth } from '../../../context/AuthContext'
import { getPermissions } from './permissions'

export default function DepartmentDetailPage({ basePath }) {
  const { deptId } = useParams()
  const { user } = useAuth()
  const { data, loading } = useAPI(`/college-admin/departments/${deptId}`, { fallback: {} })
  const perms = getPermissions(user?.role)

  const stats = data?.stats || {}
  const att = stats.todayAttendance || {}

  const teacherColumns = [
    { header: 'Teacher', accessor: 'name', cell: (row) => (
      <Link to={`${basePath}/departments/${deptId}/teachers/${row.id}`} className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50 group-hover:text-brand-300 transition-colors">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </Link>
    )},
    { header: 'Subjects', cell: (row) => {
      const assigns = row.teacherAssignments || []
      if (assigns.length === 0) return <span className="text-xs text-amber-400 italic">⚠ None</span>
      return (
        <div className="flex flex-wrap gap-1">
          {assigns.map(a => (
            <span key={a.id} className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              {a.subject.name}
            </span>
          ))}
        </div>
      )
    }},
  ]

  const studentColumns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
      <Link to={`${basePath}/departments/${deptId}/students/${row.id}`} className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-full bg-emerald-500/12 flex items-center justify-center text-xs font-bold text-emerald-300">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50 group-hover:text-brand-300 transition-colors">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </Link>
    )},
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Departments', to: `${basePath}/departments` },
        { label: data?.name || '...' },
      ]} />

      <div>
        <h1 className="text-2xl font-extrabold font-heading">{data?.name || 'Department'}</h1>
        <p className="text-sm text-dark-200 mt-1.5">Department overview and drill-down.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Teachers" value={loading ? '—' : stats.teachers?.toString() || '0'} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : stats.students?.toString() || '0'} />
        <StatCard icon={BookOpen} label="Subjects" value={loading ? '—' : stats.subjects?.toString() || '0'} />
        <StatCard icon={ClipboardCheck} label="Today's Attendance" value={loading ? '—' : `${att.percentage || 0}%`} />
      </div>

      {/* HOD & Dean cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-dark-700/60 border border-dark-500/25">
          <p className="text-xs text-dark-400 font-medium mb-3 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Head of Department</p>
          {data?.hod ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                {data.hod.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-dark-50">{data.hod.name}</p>
                <p className="text-xs text-dark-400">{data.hod.email}</p>
              </div>
            </div>
          ) : <p className="text-sm text-dark-500 italic">Not assigned</p>}
        </div>
        <div className="p-4 rounded-2xl bg-dark-700/60 border border-dark-500/25">
          <p className="text-xs text-dark-400 font-medium mb-3 flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /> Dean</p>
          {data?.dean ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/12 flex items-center justify-center text-sm font-bold text-violet-300">
                {data.dean.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-dark-50">{data.dean.name}</p>
                <p className="text-xs text-dark-400">{data.dean.email}</p>
              </div>
            </div>
          ) : <p className="text-sm text-dark-500 italic">Not assigned</p>}
        </div>
      </div>

      {/* Teachers list */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Teachers ({(data?.teachers || []).length})</h3>
        <DataTable columns={teacherColumns} data={data?.teachers || []} searchPlaceholder="Search teachers..." />
      </div>

      {/* Students list */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Students ({(data?.students || []).length})</h3>
        <DataTable columns={studentColumns} data={data?.students || []} searchPlaceholder="Search students..." />
      </div>
    </div>
  )
}
