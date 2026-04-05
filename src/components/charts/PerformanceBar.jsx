import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PerformanceBar({ data = [], dataKey = 'score', nameKey = 'subject', height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
        <XAxis
          dataKey={nameKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: '#1E293B',
            border: '1px solid rgba(51,65,85,0.4)',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#f8fafc',
          }}
          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <Bar dataKey={dataKey} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
