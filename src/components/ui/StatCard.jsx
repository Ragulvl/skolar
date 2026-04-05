import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, className = '' }) {
  const isPositive = trend > 0

  return (
    <div className={`bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5 card-hover ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl gradient-brand-subtle">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
            ${isPositive ? 'bg-emerald-500/12 text-emerald-400' : 'bg-red-500/12 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-extrabold font-heading text-dark-50 tracking-tight">{value}</p>
      <p className="text-sm text-dark-300 mt-1">{label}</p>
      {trendLabel && (
        <p className="text-xs text-dark-400 mt-2">{trendLabel}</p>
      )}
    </div>
  )
}
