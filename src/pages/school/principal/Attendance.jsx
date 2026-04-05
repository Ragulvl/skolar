import { useState, useEffect } from 'react'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import GrowthLine from '../../../components/charts/GrowthLine'

export default function SchoolPrincipalAttendance() {
  const [attendanceByGrade] = useState([])
  const [monthlyData] = useState([])

  useEffect(() => {
    // TODO: Fetch attendance data from API
  }, [])

  const emptyChart = (label) => (
    <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">{label}</div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Attendance Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">View attendance analytics across grades.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Attendance by Grade</h3>
          <p className="text-xs text-dark-400 mb-4">Average attendance percentage</p>
          {attendanceByGrade.length > 0 ? <PerformanceBar data={attendanceByGrade} /> : emptyChart('No data yet')}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Monthly Trend</h3>
          <p className="text-xs text-dark-400 mb-4">Attendance over the year</p>
          {monthlyData.length > 0 ? <GrowthLine data={monthlyData} color="#22c55e" /> : emptyChart('No data yet')}
        </div>
      </div>
    </div>
  )
}
