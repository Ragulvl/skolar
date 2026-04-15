import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, MapPin, Calendar,
  BookOpen, ClipboardList, UserCheck, UserX,
  BarChart3, Layers, Building2,
  GraduationCap, ChevronRight
} from 'lucide-react'
import useAPI from '../../hooks/useAPI'

export default function AdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const { data: user, loading } = useAPI(
    userId ? `/admin/users/${userId}` : null,
    { staleTime: 60_000, fallback: null }
  )

  const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'

  const ROLE_COLORS = {
    principal: { bg: '#f59e0b', text: '#f59e0b' },
    vice_principal: { bg: '#fbbf24', text: '#fbbf24' },
    chairman: { bg: '#8b5cf6', text: '#8b5cf6' },
    vice_chairman: { bg: '#a78bfa', text: '#a78bfa' },
    dean: { bg: '#06b6d4', text: '#06b6d4' },
    hod: { bg: '#14b8a6', text: '#14b8a6' },
    teacher: { bg: '#10b981', text: '#10b981' },
    student: { bg: '#3b82f6', text: '#3b82f6' },
    pending: { bg: '#f97316', text: '#f97316' },
  }

  const rc = ROLE_COLORS[user?.role] || { bg: '#6366f1', text: '#6366f1' }

  const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-800/25 border border-dark-500/8">
      <span className="text-[11px] text-dark-500 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[13px] text-dark-200 font-medium truncate ml-4 text-right">{value}</span>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" style={{ maxWidth: 960 }}>
        <div className="h-6 w-32 bg-dark-700/40 rounded" />
        <div className="h-36 bg-dark-700/40 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 bg-dark-700/40 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <UserCheck className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-200">User not found</h2>
        <button onClick={() => navigate('/dashboard/admin/users')}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors">← Back to Users</button>
      </div>
    )
  }

  const hasAcademicInfo = user.grade || user.section || user.department
  const hasAssignments = user.teacherAssignments?.length > 0
  const hasResults = user.assessmentResults?.length > 0

  return (
    <div style={{ maxWidth: 960 }} className="pb-8 space-y-6 mx-auto">

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/admin/users')}
        className="group inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-100 transition-all">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Users
      </button>

      {/* ═══════════ PROFILE CARD ═══════════ */}
      <section className="rounded-2xl border border-dark-500/20 bg-dark-700/40 overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${rc.bg}, ${rc.bg}30, transparent)` }} />
        <div className="p-6 flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-xl shrink-0 ring-2 ring-dark-500/20" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${rc.bg}cc, ${rc.bg}80)`, boxShadow: `0 4px 20px ${rc.bg}25` }}>
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold font-heading text-dark-50 tracking-tight">{user.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border"
                style={{ backgroundColor: `${rc.bg}12`, borderColor: `${rc.bg}25`, color: rc.text }}>
                {formatRole(user.role)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border
                ${user.isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {user.isApproved ? <><UserCheck className="w-3 h-3" /> Approved</> : <><UserX className="w-3 h-3" /> Pending</>}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-dark-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-dark-500" />{user.email}</span>
              {user.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-dark-500" />{user.institution.name}
                  {user.institution.city && <><span className="text-dark-600 mx-0.5">·</span><MapPin className="w-3 h-3 text-dark-500" />{user.institution.city}</>}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-dark-500">
                <Calendar className="w-3 h-3" />
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Stats pills */}
          {(user.attendanceSummary?.total > 0 || user.averageScore !== null) && (
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-500/10">
                <p className="text-base font-extrabold font-heading text-dark-50">{user.attendanceSummary?.rate != null ? `${user.attendanceSummary.rate}%` : '—'}</p>
                <p className="text-[10px] text-dark-500 uppercase tracking-wider">Attendance</p>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-500/10">
                <p className="text-base font-extrabold font-heading text-brand-400">{user.averageScore != null ? `${user.averageScore}%` : '—'}</p>
                <p className="text-[10px] text-dark-500 uppercase tracking-wider">Avg Score</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ DETAILS ROW ═══════════ */}
      {(user.institution || hasAcademicInfo || hasAssignments || hasResults) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Institution / Academic */}
          <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h3 className="font-semibold font-heading text-dark-100 text-sm">
                {hasAcademicInfo ? 'Academic Details' : 'Institution'}
              </h3>
            </div>
            <div className="space-y-1.5">
              {user.institution && <InfoRow label="Institution" value={user.institution.name} />}
              {user.institution?.type && <InfoRow label="Type" value={user.institution.type.charAt(0).toUpperCase() + user.institution.type.slice(1)} />}
              {user.institution?.city && <InfoRow label="City" value={user.institution.city} />}
              {user.grade && <InfoRow label="Grade" value={user.grade.name} />}
              {user.section && <InfoRow label="Section" value={user.section.name} />}
              {user.department && <InfoRow label="Department" value={user.department.name} />}
            </div>
          </div>

          {/* Assignments or Results */}
          {hasAssignments ? (
            <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold font-heading text-dark-100 text-sm">Teaching Assignments</h3>
                  <p className="text-[11px] text-dark-500">{user.teacherAssignments.length} subject{user.teacherAssignments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {user.teacherAssignments.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/25 border border-dark-500/8">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-dark-200 truncate">{a.subject?.name || '—'}</p>
                      <p className="text-[11px] text-dark-500">
                        {a.section?.grade?.name ? `Grade ${a.section.grade.name}` : ''}{a.section?.name ? ` · Sec ${a.section.name}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-dark-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : hasResults ? (
            <div className="bg-dark-700/40 border border-dark-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <h3 className="font-semibold font-heading text-dark-100 text-sm">Assessment Results</h3>
              </div>
              <div className="space-y-1.5">
                {user.assessmentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-800/25 border border-dark-500/8">
                    <span className="text-[13px] text-dark-200 truncate mr-3">{r.assessment?.title || 'Assessment'}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-12 rounded-full bg-dark-600/40 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-[13px] font-bold w-[34px] text-right" style={{ color: r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {r.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
        </section>
      )}
    </div>
  )
}
