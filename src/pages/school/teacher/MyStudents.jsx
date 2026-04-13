import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../context/AuthContext'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function SchoolTeacherStudents() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    user?.institutionId ? `/school/students-by-institution/${user.institutionId}` : null,
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const columns = [
    { header: 'Student', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-500/15 flex items-center justify-center text-xs font-bold text-brand-400">
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <span className="font-medium text-dark-50">{row.name}</span>
      </div>
    )},
    { header: 'Grade', accessor: 'grade', cell: (row) => <span>Grade {row.grade}</span> },
    { header: 'Section', accessor: 'section', cell: (row) => <Badge variant="neutral" size="sm">{row.section}</Badge> },
  ]

  return (
    <PaginatedDataPage
      title="My Students"
      subtitle="View student performance across your classes."
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
    />
  )
}
