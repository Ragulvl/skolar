import { UserCheck, UserX, Clock } from 'lucide-react'
import Badge from './Badge'

export default function PendingApprovalCard({ user, onApprove, onReject, roles = [] }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5
      bg-dark-700/60 border border-dark-500/25 rounded-2xl card-hover">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center text-sm font-bold text-white shrink-0">
          {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-dark-50">{user.name}</p>
          <p className="text-sm text-dark-300 mt-0.5">{user.email}</p>
        </div>
        <Badge variant="warning" size="sm" dot>
          Pending
        </Badge>
      </div>
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {roles.length > 0 && (
          <select
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-500/40
              text-sm text-dark-50 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
            defaultValue=""
            id={`role-select-${user.id}`}
          >
            <option value="" disabled>Assign Role</option>
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}
        <button
          onClick={onApprove}
          className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="Approve"
        >
          <UserCheck className="w-4 h-4" />
        </button>
        <button
          onClick={onReject}
          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Reject"
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
