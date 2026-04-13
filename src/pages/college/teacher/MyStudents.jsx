import { useState } from 'react'
import { GraduationCap, Building2 } from 'lucide-react'
import PaginatedDataPage from '../../../components/ui/PaginatedDataPage'
import Badge from '../../../components/ui/Badge'
import { usePaginatedAPI } from '../../../hooks/useAPI'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

export default function CollegeTeacherMyStudents() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { items, loading, loadingMore, hasMore, total, loadMore } = usePaginatedAPI(
    '/teacher/my-students',
    { params: { search: debouncedSearch }, pageSize: 20, staleTime: 60_000 }
  )

  const ownDeptCount = items.filter(s => s.isOwnDept).length
  const crossDeptCount = items.filter(s => !s.isOwnDept).length

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/12 flex items-center justify-center text-xs font-bold text-emerald-300">
            {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-dark-50">{row.name}</p>
            <p className="text-xs text-dark-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-sm text-dark-200">{row.department?.name || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Scope',
      cell: (row) => row.isOwnDept ? (
        <Badge variant="brand" size="sm">Own Dept</Badge>
      ) : (
        <Badge variant="violet" size="sm">Cross-Dept</Badge>
      ),
    },
  ]

  return (
    <PaginatedDataPage
      title="My Students"
      subtitle={<>
        Students across all your assigned departments.
        {items.length > 0 && (
          <span className="ml-2">
            <span className="text-brand-400">{ownDeptCount} own dept</span>
            {crossDeptCount > 0 && <span className="text-violet-400 ml-2">· {crossDeptCount} cross-dept</span>}
          </span>
        )}
      </>}
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
      emptyTitle={loading ? 'Loading...' : 'No students yet'}
      emptyMessage="No students found in your assigned departments."
    />
  )
}
