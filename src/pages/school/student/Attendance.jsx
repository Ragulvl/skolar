import { useState, useEffect } from 'react'
import AttendanceDonut from '../../../components/charts/AttendanceDonut'

export default function SchoolStudentAttendance() {
  const [monthlyAttendance, setMonthlyAttendance] = useState([])

  useEffect(() => {
    // TODO: Fetch student attendance from API
  }, [])

  const totalPresent = monthlyAttendance.reduce((s, m) => s + m.present, 0)
  const totalAbsent = monthlyAttendance.reduce((s, m) => s + m.absent, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">My Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Track your attendance throughout the year.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="font-semibold font-heading mb-4">Overall Attendance</h3>
          <AttendanceDonut present={totalPresent} absent={totalAbsent} size={200} />
        </div>

        <div className="lg:col-span-2 bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-4">Monthly Breakdown</h3>
          {monthlyAttendance.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {monthlyAttendance.map(m => {
                const total = m.present + m.absent
                const pct = total > 0 ? Math.round((m.present / total) * 100) : 0
                return (
                  <div key={m.month} className="text-center p-3 rounded-lg bg-dark-800/50 border border-dark-500/20">
                    <p className="text-xs text-dark-400 mb-1">{m.month}</p>
                    <p className={`text-lg font-bold font-heading ${pct >= 90 ? 'text-success' : pct >= 75 ? 'text-warning' : 'text-danger'}`}>
                      {pct}%
                    </p>
                    <p className="text-[10px] text-dark-500 mt-0.5">{m.present}/{total}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-dark-400">No attendance data yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
