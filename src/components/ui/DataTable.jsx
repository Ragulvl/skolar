import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data found',
  actions,
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let result = [...data]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(row =>
        columns.some(col => {
          const val = col.accessor ? row[col.accessor] : ''
          return String(val).toLowerCase().includes(q)
        })
      )
    }
    if (sortCol) {
      result.sort((a, b) => {
        const aVal = a[sortCol] ?? ''
        const bVal = b[sortCol] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [data, search, sortCol, sortDir, columns])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (accessor) => {
    if (sortCol === accessor) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(accessor)
      setSortDir('asc')
    }
  }

  return (
    <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-dark-500/20">
          {searchable && (
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="w-full pl-10 pr-4 h-10 rounded-xl bg-dark-800 border border-dark-500/40
                  text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500
                  focus:ring-2 focus:ring-brand-500/15 transition-all"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/20 bg-dark-800/40">
              {columns.map(col => (
                <th
                  key={col.accessor || col.header}
                  className={`px-5 py-3.5 text-left text-[11px] font-semibold text-dark-300 uppercase tracking-wider
                    ${col.sortable !== false ? 'cursor-pointer hover:text-dark-100 select-none transition-colors' : ''}`}
                  onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      sortCol === col.accessor
                        ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                        : <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-500/15">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-dark-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-brand-500/5' : 'hover:bg-dark-600/20'}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={col.accessor || col.header} className="px-5 py-3.5 text-sm text-dark-200">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-dark-500/20 bg-dark-800/30">
          <p className="text-xs text-dark-400">
            Showing <span className="text-dark-200 font-medium">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)}</span> of {filtered.length}
          </p>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="p-2 rounded-lg hover:bg-dark-600/40 text-dark-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="p-2 rounded-lg hover:bg-dark-600/40 text-dark-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-semibold text-dark-200 bg-dark-700/60 rounded-lg mx-1">
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-dark-600/40 text-dark-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-dark-600/40 text-dark-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
