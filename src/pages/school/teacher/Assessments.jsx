import { useState, useEffect } from 'react'
import { Plus, FileText, ClipboardList } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import FormInput from '../../../components/ui/FormInput'

export default function SchoolTeacherAssessments() {
  const [showModal, setShowModal] = useState(false)
  const [assessments, setAssessments] = useState([])
  const [classes] = useState([]) // TODO: fetch assigned classes

  useEffect(() => {
    // TODO: Fetch assessments from API
  }, [])

  const columns = [
    { header: 'Assessment', accessor: 'title', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
          ${row.type === 'mcq' ? 'bg-brand-500/15' : 'bg-violet-500/15'}`}>
          {row.type === 'mcq' ? <ClipboardList className="w-4 h-4 text-brand-400" /> : <FileText className="w-4 h-4 text-violet-400" />}
        </div>
        <div>
          <p className="font-medium text-dark-50">{row.title}</p>
          <p className="text-xs text-dark-400">{row.subject}</p>
        </div>
      </div>
    )},
    { header: 'Type', accessor: 'type', cell: (row) => (
      <Badge variant={row.type === 'mcq' ? 'brand' : 'violet'} size="sm">{row.type?.toUpperCase()}</Badge>
    )},
    { header: 'Due Date', accessor: 'dueDate', cell: (row) => (
      <span className="text-dark-200">{row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
    )},
    { header: 'Submissions', accessor: 'submissions', cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-dark-500/40 max-w-20">
          <div className="h-full rounded-full bg-success" style={{ width: `${row.total ? (row.submissions / row.total) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-dark-300">{row.submissions || 0}/{row.total || 0}</span>
      </div>
    )},
    { header: 'Actions', sortable: false, cell: () => (
      <button className="text-xs text-brand-400 hover:text-brand-300 font-medium">View Results</button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Assessments</h1>
          <p className="text-sm text-dark-200 mt-1.5">Create and manage assessments for your classes.</p>
        </div>
      </div>

      <DataTable columns={columns} data={assessments} searchPlaceholder="Search assessments..."
        actions={
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium flex items-center gap-2 hover:shadow-glow transition-all">
            <Plus className="w-4 h-4" /> Create Assessment
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Assessment" size="lg"
        footer={<>
          <button onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg text-sm text-dark-200 hover:bg-dark-600/60 border border-dark-500/40">Cancel</button>
          <button className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium">Create</button>
        </>}>
        <div className="space-y-4">
          <FormInput label="Title" placeholder="Enter assessment title" required />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Type" type="select">
              <option value="mcq">MCQ</option>
              <option value="descriptive">Descriptive</option>
            </FormInput>
            <FormInput label="Due Date" type="date" />
          </div>
          <FormInput label="Class" type="select">
            <option value="">Select class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.subject} - Grade {c.grade} - {c.section}</option>
            ))}
          </FormInput>
        </div>
      </Modal>
    </div>
  )
}
