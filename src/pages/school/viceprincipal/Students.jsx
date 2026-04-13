import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function SchoolVPStudents() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    '/viceprincipal/students',
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const columns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
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
    { header: 'Grade', accessor: 'grade', cell: (row) => row.grade?.name || '—' },
    { header: 'Section', accessor: 'section', cell: (row) => row.section?.name || '—' },
  ]

  return (
    <PaginatedDataPage
      title="Students"
      subtitle="Students in your assigned grades."
      columns={columns}
      items={items}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      total={total}
      onLoadMore={loadMore}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search students..."
      emptyIcon={GraduationCap}
      emptyTitle="No students found"
      emptyMessage="No students in your assigned grades yet."
    />
  )
}
