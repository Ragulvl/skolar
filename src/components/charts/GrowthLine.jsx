import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

export default function GrowthLine({ data = [], dataKey = 'value', nameKey = 'month', height = 300, color = '#6366f1' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        />
        <Tooltip
          contentStyle={{
            background: '#1E293B',
            border: '1px solid rgba(51,65,85,0.4)',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#f8fafc',
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#gradient-${dataKey})`}
          dot={{ fill: color, r: 4, strokeWidth: 2, stroke: '#1E293B' }}
          activeDot={{ fill: color, r: 6, strokeWidth: 3, stroke: '#1E293B' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
