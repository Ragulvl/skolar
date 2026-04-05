const variants = {
  success: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/12 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/12 text-blue-400 border border-blue-500/20',
  brand: 'bg-brand-500/12 text-brand-300 border border-brand-500/20',
  violet: 'bg-violet-500/12 text-violet-400 border border-violet-500/20',
  neutral: 'bg-dark-500/20 text-dark-200 border border-dark-500/25',
}

const sizes = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3.5 py-1.5 gap-1.5',
}

export default function Badge({ children, variant = 'neutral', size = 'md', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap leading-none
      ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  )
}
