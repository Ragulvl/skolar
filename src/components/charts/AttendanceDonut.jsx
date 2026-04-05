import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b']

export default function AttendanceDonut({ present = 0, absent = 0, late = 0, size = 200 }) {
  const total = present + absent + late
  const data = [
    { name: 'Present', value: present },
    { name: 'Absent', value: absent },
    ...(late > 0 ? [{ name: 'Late', value: late }] : []),
  ].filter(d => d.value > 0)

  const percentage = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length > 0 ? data : [{ name: 'No Data', value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.42}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.length > 0 ? (
                data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)
              ) : (
                <Cell fill="#334155" />
              )}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1E293B',
                border: '1px solid rgba(51,65,85,0.4)',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-heading text-dark-50">{percentage}%</span>
          <span className="text-xs text-dark-300">Attendance</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-dark-300">{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
