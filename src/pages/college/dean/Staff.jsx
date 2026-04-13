import { useState } from 'react'
import { Users } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function CollegeDeanStaff() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    '/dean/staff',
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const columns = [
    { header: 'Name', accessor: 'name', cell: (row) => (
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
    { header: 'Role', accessor: 'role', cell: (row) => <Badge variant="violet" size="sm">{row.role.replace(/_/g, ' ')}</Badge> },
    { header: 'Department', cell: (row) => row.department?.name || '—' },
  ]

  return (
    <PaginatedDataPage
      title="Staff"
      subtitle="HODs and teachers in your departments."
      columns={columns}
      items={items}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      total={total}
      onLoadMore={loadMore}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search staff..."
      emptyIcon={Users}
      emptyTitle="No staff found"
    />
  )
}
