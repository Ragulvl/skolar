import { useState, useEffect } from 'react'
import PerformanceBar from '../../../components/charts/PerformanceBar'

export default function SchoolPrincipalAssessments() {
  const [assessmentData] = useState([])

  useEffect(() => {
    // TODO: Fetch assessment data from API
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Assessment Reports</h1>
        <p className="text-sm text-dark-200 mt-1.5">Performance overview across subjects.</p>
      </div>
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-1">Subject-wise Average Scores</h3>
        <p className="text-xs text-dark-400 mb-4">Across all grades</p>
        {assessmentData.length > 0 ? (
          <PerformanceBar data={assessmentData} height={350} />
        ) : (
          <div className="flex items-center justify-center h-[350px] text-sm text-dark-400">No assessment data yet</div>
        )}
      </div>
    </div>
  )
}
