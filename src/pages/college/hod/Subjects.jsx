import { BookOpen, Plus, Users, X, UserPlus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

export default function CollegeHODSubjects() {
  const { data: subjects, loading, refetch } = useAPI('/hod/subjects', { fallback: [] })
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  // Assign teacher modal
  const [showAssign, setShowAssign] = useState(false)
  const [assignSubject, setAssignSubject] = useState(null)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [assigning, setAssigning] = useState(false)
  const { data: availableTeachers } = useAPI('/hod/available-teachers', { fallback: [] })

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.post('/hod/subjects', { name: newName })
      setNewName('')
      setShowModal(false)
      invalidateCache('/hod')
      refetch()
    } catch {} finally { setSaving(false) }
  }

  const handleAssign = async () => {
    if (!selectedTeacher || !assignSubject) return
    setAssigning(true)
    try {
      await api.post('/hod/assign-subject', { teacherId: selectedTeacher, subjectId: assignSubject.id })
      setShowAssign(false)
      setSelectedTeacher('')
      setAssignSubject(null)
      invalidateCache('/hod')
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign')
    } finally { setAssigning(false) }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Remove this teacher assignment?')) return
    try {
      await api.delete(`/hod/assignments/${assignmentId}`)
      invalidateCache('/hod')
      refetch()
    } catch {}
  }

  const openAssign = (subject) => {
    setAssignSubject(subject)
    setSelectedTeacher('')
    setShowAssign(true)
  }

  const columns = [
    { header: 'Subject', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/12 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-brand-400" />
        </div>
        <span className="font-medium text-dark-50">{row.name}</span>
      </div>
    )},
    { header: 'Assigned Teachers', cell: (row) => {
      const assignments = row.teacherAssignments || []
      if (assignments.length === 0) return <span className="text-xs text-dark-500 italic">None</span>
      return (
        <div className="flex flex-wrap gap-1.5">
          {assignments.map(a => (
            <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
              {a.teacher.name}
              <button onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(a.id) }}
                className="hover:text-danger transition-colors ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )
    }},
    { header: 'Assessments', cell: (row) => row._count?.assessments || 0 },
    { header: '', cell: (row) => (
      <button onClick={() => openAssign(row)}
        className="p-2 rounded-lg hover:bg-dark-600/60 text-dark-400 hover:text-brand-400 transition-all"
        title="Assign Teacher">
        <UserPlus className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Subjects</h1>
          <p className="text-sm text-dark-200 mt-1.5">Manage subjects and assign teachers.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium gradient-brand text-white hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>
      <DataTable columns={columns} data={subjects} searchPlaceholder="Search subjects..." />

      {/* Create Subject Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Subject" footer={
        <>
          <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-dark-300 hover:text-dark-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !newName.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium gradient-brand text-white disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </>
      }>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Subject name"
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-500/40 text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title={`Assign Teacher → ${assignSubject?.name || ''}`} footer={
        <>
          <button onClick={() => setShowAssign(false)} className="px-4 py-2 rounded-xl text-sm text-dark-300 hover:text-dark-50">Cancel</button>
          <button onClick={handleAssign} disabled={assigning || !selectedTeacher}
            className="px-5 py-2 rounded-xl text-sm font-medium gradient-brand text-white disabled:opacity-50 flex items-center gap-2">
            {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <>Assign <UserPlus className="w-4 h-4" /></>}
          </button>
        </>
      }>
        <div className="space-y-3">
          <p className="text-sm text-dark-300">Select a teacher to assign to <strong className="text-dark-100">{assignSubject?.name}</strong>:</p>
          <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-500/40 text-sm text-dark-50 focus:outline-none focus:border-brand-500">
            <option value="">Select a teacher...</option>
            {(availableTeachers || []).map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
            ))}
          </select>
          {availableTeachers?.length === 0 && (
            <p className="text-xs text-dark-500">No teachers available. Add teachers to your department first.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
