import { useParams } from 'react-router-dom'
import { ClipboardCheck, FileText, Award, TrendingUp, BookOpen } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Breadcrumb from '../../../components/ui/Breadcrumb'
import useAPI from '../../../hooks/useAPI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function StudentProfilePage({ basePath }) {
  const { deptId, studentId } = useParams()
  const { data, loading } = useAPI(`/college-admin/departments/${deptId}/students/${studentId}`, { fallback: {} })
  const deptDetail = useAPI(`/college-admin/departments/${deptId}`, { fallback: {} })
  const deptName = deptDetail.data?.name || '...'

  const stats = data?.overallStats || {}
  const attendanceBySubject = data?.attendanceBySubject || []
  const assessmentResults = data?.assessmentResults || []
  const certificates = data?.certificates || []

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Departments', to: `${basePath}/departments` },
        { label: deptName, to: `${basePath}/departments/${deptId}` },
        { label: 'Students', to: `${basePath}/departments/${deptId}` },
        { label: data?.name || '...' },
      ]} />

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/12 flex items-center justify-center text-xl font-bold text-emerald-300">
          {data?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold font-heading">{data?.name || 'Student'}</h1>
          <p className="text-sm text-dark-300 mt-0.5">{data?.email}</p>
          <p className="text-xs text-dark-400 mt-1">{data?.department?.name || 'No department'} · Joined {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</p>
        </div>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="Attendance" value={loading ? '—' : `${stats.attendancePercentage || 0}%`} />
        <StatCard icon={FileText} label="Assessments" value={loading ? '—' : (stats.totalAssessments || 0).toString()} />
        <StatCard icon={TrendingUp} label="Avg Score" value={loading ? '—' : stats.avgScore?.toString() || '0'} />
        <StatCard icon={Award} label="Certificates" value={loading ? '—' : (stats.certificateCount || 0).toString()} />
      </div>

      {/* Attendance per subject (bar chart) */}
      {attendanceBySubject.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Attendance by Subject</h3>
          <p className="text-xs text-dark-400 mb-4">Percentage of classes attended per subject</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBySubject} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8b8fa3', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#e0e2f0', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="percentage" fill="url(#attendGrad)" radius={[0, 6, 6, 0]} />
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assessment scores table */}
      {assessmentResults.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Assessment Scores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-500/20">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Assessment</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">Subject</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Type</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">Score</th>
                  <th className="text-right py-3 px-4 text-dark-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {assessmentResults.map(r => (
                  <tr key={r.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-colors">
                    <td className="py-3 px-4 text-dark-100 font-medium">{r.assessment.title}</td>
                    <td className="py-3 px-4 text-dark-300">{r.assessment.subject?.name}</td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-dark-600/40 text-xs text-dark-300">{r.assessment.type}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-sm font-bold ${
                        r.score >= 80 ? 'text-success' : r.score >= 50 ? 'text-amber-400' : 'text-danger'
                      }`}>{r.score}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-dark-400 text-xs">
                      {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Certificates Earned</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/30 border border-amber-500/15">
                <div className="w-9 h-9 rounded-lg bg-amber-500/12 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark-100">{c.title}</p>
                  <p className="text-xs text-dark-400">{c.subject.name} · by {c.issuer.name}</p>
                  <p className="text-xs text-dark-500">
                    {new Date(c.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && attendanceBySubject.length === 0 && assessmentResults.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No academic activity recorded yet.</p>
        </div>
      )}
    </div>
  )
}
