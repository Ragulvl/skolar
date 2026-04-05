import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="p-5 rounded-2xl bg-dark-700/60 border border-dark-500/25 mb-6">
        <Icon className="w-8 h-8 text-dark-400" />
      </div>
      <h3 className="text-lg font-semibold font-heading text-dark-50">{title || 'No data yet'}</h3>
      {message && <p className="text-sm text-dark-300 mt-2 max-w-sm text-center leading-relaxed">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
