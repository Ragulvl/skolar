import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899']

export default function PieBreakdown({ data = [], dataKey = 'value', nameKey = 'name', height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={55}
          dataKey={dataKey}
          nameKey={nameKey}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
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
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-dark-200 ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
