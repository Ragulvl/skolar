import { Building2, Users, GraduationCap, ClipboardCheck, FileText, TrendingUp, UserCheck, BarChart3, UserCog, BookOpen, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../../components/ui/StatCard'
import { useAuth } from '../../../context/AuthContext'
import useAPI from '../../../hooks/useAPI'
import { getPermissions, ROLE_LABELS } from './permissions'

export default function OverviewPage({ basePath }) {
  const { user } = useAuth()
  const { data, loading } = useAPI('/college-admin/overview', { fallback: {} })
  const perms = getPermissions(user?.role)
  const roleLabel = ROLE_LABELS[user?.role] || 'Admin'

  const att = data?.todayAttendance || {}

  // Build quick action links based on role
  const quickActions = []
  if (perms.canManageStaff) {
    quickActions.push({ to: `${basePath}/staff`, icon: UserCog, label: 'Manage Staff', desc: 'View and manage teaching staff', color: 'brand' })
  }
  if (perms.canAssignDean) {
    quickActions.push({ to: `${basePath}/departments`, icon: Award, label: 'Assign Deans', desc: 'Assign deans to departments', color: 'violet' })
  }
  if (perms.canAssignHOD) {
    quickActions.push({ to: `${basePath}/departments`, icon: Building2, label: 'Manage Departments', desc: 'HOD assignments & structure', color: 'emerald' })
  }
  if (perms.canViewAnalytics) {
    quickActions.push({ to: `${basePath}/analytics`, icon: BarChart3, label: 'View Analytics', desc: 'Institution-wide insights', color: 'amber' })
  }

  const COLOR_MAP = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20 hover:border-brand-500/40' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20 hover:border-violet-500/40' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-500/40' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">College Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{data?.institution?.name || 'Your institution at a glance.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Building2} label="Departments" value={loading ? '—' : (data.departments || 0).toString()} />
        <StatCard icon={Users} label="Staff" value={loading ? '—' : (data.staff || 0).toString()} />
        <StatCard icon={GraduationCap} label="Students" value={loading ? '—' : (data.students || 0).toString()} />
        <StatCard icon={ClipboardCheck} label="Today's Attendance" value={loading ? '—' : `${att.percentage || 0}%`} />
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : (data.assessments || 0).toString()} />
      </div>

      {/* Pending approval alert */}
      {data.pending > 0 && perms.canApproveUsers && (
        <Link to={`${basePath}/pending`}
          className="block p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">
              {data.pending} user{data.pending > 1 ? 's' : ''} pending approval
            </span>
          </div>
        </Link>
      )}

      {/* Role-specific quick actions */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const colors = COLOR_MAP[action.color]
            return (
              <Link key={i} to={action.to}
                className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} transition-all group`}>
                <div className="flex items-center gap-3 mb-2">
                  <action.icon className={`w-5 h-5 ${colors.text}`} />
                  <span className={`text-sm font-semibold ${colors.text}`}>{action.label}</span>
                </div>
                <p className="text-xs text-dark-400">{action.desc}</p>
              </Link>
            )
          })}
        </div>
      )}

      {/* Departments grid */}
      {(data.departmentList || []).length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold font-heading">All Departments</h3>
              <p className="text-xs text-dark-400 mt-0.5">Click to drill down</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.departmentList.map(dept => (
              <Link key={dept.id} to={`${basePath}/departments/${dept.id}`}
                className="p-4 rounded-xl bg-dark-800/50 border border-dark-500/15 hover:border-brand-500/30 hover:bg-dark-700/60 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/12 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                    <Building2 className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dark-50 truncate group-hover:text-brand-300 transition-colors">{dept.name}</p>
                    <p className="text-xs text-dark-400">HOD: {dept.hodName}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-dark-400">
                  <span>{dept.teacherCount} staff</span>
                  <span>{dept.subjectCount} subjects</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
