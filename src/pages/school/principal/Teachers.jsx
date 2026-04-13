import { useState } from 'react'
import { UserCog, Users } from 'lucide-react'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function SchoolPrincipalTeachers() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    user?.institutionId ? `/school/teachers-by-institution/${user.institutionId}` : null,
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const columns = [
    {
      header: 'Teacher', accessor: 'name', cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
            {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-dark-50">{row.name}</p>
            <p className="text-xs text-dark-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject', cell: (row) => <Badge variant="brand" size="sm">{row.subject}</Badge> },
    { header: 'Grade', accessor: 'grade', cell: (row) => <span className="text-dark-100">Grade {row.grade}</span> },
    { header: 'Section', accessor: 'section', cell: (row) => <Badge variant="neutral" size="sm">{row.section}</Badge> },
  ]

  return (
    <PaginatedDataPage
      title="Teachers"
      subtitle="View and manage teacher assignments."
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
      emptyMessage="No teachers assigned to this institution yet."
    />
  )
}
