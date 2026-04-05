import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb navigation for drill-down pages.
 * @param {Array} items - [{ label: string, to?: string }]
 */
export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-dark-500" />}
          {item.to ? (
            <Link
              to={item.to}
              className="text-dark-400 hover:text-brand-400 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-dark-100 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
