import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function InstitutionCodeDisplay({ code, type }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-dark-800 border border-dark-500/30">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-widest text-dark-400 font-semibold">
          {type === 'school' ? 'School' : 'College'} Code
        </span>
        <span className="text-lg font-mono font-bold text-brand-400 tracking-widest">{code}</span>
      </div>
      <button
        onClick={handleCopy}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          copied
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'hover:bg-dark-700 text-dark-400 hover:text-dark-100'
        }`}
        title={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}
