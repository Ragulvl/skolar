export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} relative`}>
        <div className={`${sizes[size]} rounded-full border-2 border-dark-500/20 border-t-brand-400 animate-spin`} />
        <div className={`absolute inset-1 rounded-full border-2 border-dark-500/15 border-b-violet-400 animate-[spin_1.5s_linear_infinite_reverse]`} />
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-dark-300 animate-pulse-soft font-medium">Loading…</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl shimmer" />
        <div className="w-16 h-5 rounded-lg shimmer" />
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="w-24 h-7 rounded-lg shimmer" />
        <div className="w-36 h-4 rounded shimmer" />
      </div>
    </div>
  )
}
