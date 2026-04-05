export default function ToggleSwitch({ enabled, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange?.(!enabled)}
      className={`relative inline-flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative
        ${enabled ? 'bg-brand-500' : 'bg-dark-500/60'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200
          absolute top-0.5 ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-sm text-dark-200">{label}</span>}
    </button>
  )
}
