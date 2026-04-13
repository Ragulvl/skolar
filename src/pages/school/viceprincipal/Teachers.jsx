import { useState } from 'react'
import { Users } from 'lucide-react'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function SchoolVPTeachers() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    '/viceprincipal/teachers',
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const columns = [
    { header: 'Teacher', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.name}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      </div>
    )},
    { header: 'Department', accessor: 'department', cell: (row) => (
      <span className="text-sm text-dark-200">{row.department?.name || '—'}</span>
    )},
  ]

  return (
    <PaginatedDataPage
      title="Teachers"
      subtitle="Teachers in your assigned grades."
      columns={columns}
      items={items}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      total={total}
      onLoadMore={loadMore}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search teachers..."
      emptyIcon={Users}
      emptyTitle="No teachers found"
      emptyMessage="No teachers assigned in your grades yet."
    />
  )
}
