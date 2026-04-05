import { useState, useEffect } from 'react'
import { Building2, Users, GraduationCap, BookOpen, BarChart3 } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import PieBreakdown from '../../../components/charts/PieBreakdown'
import PerformanceBar from '../../../components/charts/PerformanceBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/client'

export default function CollegeChairmanOverview() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  const institutionName = user?.institution?.name || '—'
  const institutionCode = user?.institution?.code || '—'

  useEffect(() => {
    // TODO: Fetch departments from college API when endpoint is created
    setLoading(false)
  }, [])

  const totalStudents = departments.reduce((s, d) => s + (d.students || 0), 0)
  const totalTeachers = departments.reduce((s, d) => s + (d.teachers || 0), 0)
  const deptBreakdown = departments.map(d => ({ name: d.name, value: d.students || 0 }))
  const deptPerformance = departments.map(d => ({ subject: d.name?.slice(0, 8) || '', score: d.avgScore || 0 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">College Overview</h1>
        <p className="text-sm text-dark-200 mt-1.5">{institutionName} · {institutionCode}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Departments" value={loading ? '—' : departments.length.toString()} />
        <StatCard icon={Users} label="Total Teachers" value={loading ? '—' : totalTeachers.toString()} />
        <StatCard icon={GraduationCap} label="Total Students" value={loading ? '—' : totalStudents.toLocaleString()} />
        <StatCard icon={BarChart3} label="Avg Attendance" value="—" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Students by Department</h3>
          <p className="text-xs text-dark-400 mb-4">Distribution across departments</p>
          {deptBreakdown.length > 0 ? <PieBreakdown data={deptBreakdown} /> : (
            <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">No data yet</div>
          )}
        </div>
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
          <h3 className="font-semibold font-heading mb-1">Department Performance</h3>
          <p className="text-xs text-dark-400 mb-4">Average assessment scores</p>
          {deptPerformance.length > 0 ? <PerformanceBar data={deptPerformance} /> : (
            <div className="flex items-center justify-center h-[250px] text-sm text-dark-400">No data yet</div>
          )}
        </div>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">All Departments</h3>
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {departments.map(dept => (
              <div key={dept.name} className="p-4 rounded-xl bg-dark-800/50 border border-dark-500/20 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-50 text-sm">{dept.name}</h4>
                    <p className="text-xs text-dark-400">HOD: {dept.hodName || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-300">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {dept.teachers || 0} Teachers</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {dept.students || 0} Students</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-8">No departments added yet.</p>
        )}
      </div>
    </div>
  )
}
