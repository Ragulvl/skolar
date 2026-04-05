import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-dark-200
              hover:bg-dark-600/40 border border-dark-500/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all
              ${danger ? 'bg-danger hover:bg-danger/80' : 'gradient-brand hover:shadow-glow'}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {danger && (
          <div className="p-2.5 rounded-xl bg-danger/10 shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
        )}
        <p className="text-sm text-dark-200 leading-relaxed pt-0.5">{message}</p>
      </div>
    </Modal>
  )
}
