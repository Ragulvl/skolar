import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react'

export default function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  icon: Icon,
  required,
  disabled,
  className = '',
  id,
  children,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type

  const borderClasses = error
    ? 'border-danger/50 focus:border-danger focus:ring-2 focus:ring-danger/20'
    : 'border-dark-500/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <div className={`flex flex-col gap-2 ${className}`} id={id}>
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-dark-200">
          {label}
          {required && <span className="text-danger text-xs">*</span>}
          {hint && (
            <span className="group relative ml-0.5">
              <HelpCircle className="w-3.5 h-3.5 text-dark-400 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-dark-50
                bg-dark-700 rounded-lg border border-dark-500/50 shadow-elevated whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {hint}
              </span>
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none z-10" />
        )}
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            style={{ paddingLeft: Icon ? '2.75rem' : '1rem', paddingRight: '1rem' }}
            className={`w-full rounded-[10px] bg-dark-800 border text-sm text-dark-50
              placeholder:text-dark-400 focus:outline-none transition-all duration-200
              py-3 resize-none ${borderClasses} ${disabledClasses}`}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            style={{ paddingLeft: Icon ? '2.75rem' : '1rem', paddingRight: '2.5rem' }}
            className={`w-full rounded-[10px] bg-dark-800 border text-sm text-dark-50
              placeholder:text-dark-400 focus:outline-none transition-all duration-200
              py-3 appearance-none cursor-pointer
              bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")]
              bg-[length:20px] bg-[right_12px_center] bg-no-repeat ${borderClasses} ${disabledClasses}`}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              paddingLeft: Icon ? '2.75rem' : '1rem',
              paddingRight: type === 'password' ? '2.75rem' : '1rem',
              height: '2.75rem',
            }}
            className={`w-full rounded-[10px] bg-dark-800 border text-sm text-dark-50
              placeholder:text-dark-400 focus:outline-none transition-all duration-200
              ${borderClasses} ${disabledClasses}`}
            {...props}
          />
        )}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors p-0.5"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
