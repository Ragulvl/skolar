import { ClipboardCheck } from 'lucide-react'
import useAPI from '../../../hooks/useAPI'

export default function CollegeStudentAttendance() {
  const { data, loading } = useAPI('/student/attendance', { fallback: {} })
  const stats = data?.stats || {}
  const records = data?.records || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Your personal attendance history.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{stats.present || 0}</p>
          <p className="text-xs text-dark-400">Present</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-danger">{stats.absent || 0}</p>
          <p className="text-xs text-dark-400">Absent</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.late || 0}</p>
          <p className="text-xs text-dark-400">Late</p>
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-brand-300">{stats.percentage || 0}%</p>
          <p className="text-xs text-dark-400">Rate</p>
        </div>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Recent Days</h3>
        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map(day => (
              <div key={day.date} className="p-3 rounded-xl bg-dark-800/30 border border-dark-500/10">
                <p className="text-sm font-medium text-dark-100 mb-2">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.records.map((r, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      r.status === 'present' ? 'bg-success/10 text-success' :
                      r.status === 'late' ? 'bg-amber-500/10 text-amber-300' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {r.subjectName}: {r.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardCheck className="w-10 h-10 text-dark-500 mx-auto mb-3" />
            <p className="text-sm text-dark-400">No attendance records yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
