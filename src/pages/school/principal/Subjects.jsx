import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import FormInput from '../../../components/ui/FormInput'
import { useAuth } from '../../../context/AuthContext'
import useAPI, { invalidateCache } from '../../../hooks/useAPI'
import api from '../../../api/client'

export default function SchoolPrincipalSubjects() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [subjects, setSubjects] = useState({})
  const [newSubject, setNewSubject] = useState({ name: '', gradeId: '' })
  const [creating, setCreating] = useState(false)

  const institutionId = user?.institutionId

  // ─── Cached grade data fetching ───────────────────────────────────────
  const { data: grades } = useAPI(
    institutionId ? `/school/grades/${institutionId}` : null,
    { staleTime: 300_000, fallback: [] }
  )

  // Fetch subjects per grade when grades are loaded
  // This is derived data, so we re-fetch when grades change
  useEffect(() => {
    if (!grades || grades.length === 0) return
    Promise.all(grades.map(g =>
      api.get(`/school/subjects/${g.id}`).then(r => ({ grade: g.name, gradeId: g.id, subjects: r.data.data || [] }))
    )).then(results => {
      const grouped = {}
      results.forEach(r => {
        if (r.subjects.length > 0) grouped[r.grade] = r.subjects
      })
      setSubjects(grouped)
    }).catch(() => {})
  }, [grades])

  const handleCreate = async () => {
    if (!newSubject.name || !newSubject.gradeId) return
    setCreating(true)
    try {
      await api.post('/school/subjects', { name: newSubject.name, gradeId: newSubject.gradeId, institutionId })
      setShowModal(false)
      setNewSubject({ name: '', gradeId: '' })
      // Refetch subjects for the affected grade
      const r = await api.get(`/school/subjects/${newSubject.gradeId}`)
      const grade = grades.find(g => g.id === newSubject.gradeId)
      if (grade) {
        setSubjects(prev => ({ ...prev, [grade.name]: r.data.data || [] }))
      }
      invalidateCache('/school')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subject')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Subjects</h1>
          <p className="text-sm text-dark-200 mt-1.5">Manage subjects per grade.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium flex items-center gap-2 hover:shadow-glow transition-all">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {Object.keys(subjects).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(subjects).map(([grade, subs]) => (
            <div key={grade} className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-heading text-dark-50">Grade {grade}</h3>
                <Badge variant="brand" size="sm">{subs.length} subjects</Badge>
              </div>
              <div className="space-y-2">
                {subs.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20">
                    <BookOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="text-sm text-dark-100">{sub.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-dark-400">No subjects added yet.</div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Subject" size="sm"
        footer={<>
          <button onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg text-sm text-dark-200 hover:bg-dark-600/60 border border-dark-500/40">Cancel</button>
          <button onClick={handleCreate} disabled={creating || !newSubject.name || !newSubject.gradeId}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium disabled:opacity-50">
            {creating ? 'Adding...' : 'Add Subject'}
          </button>
        </>}>
        <div className="space-y-4">
          <FormInput label="Subject Name" placeholder="e.g., Mathematics" required
            value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} />
          <FormInput label="Grade" type="select" value={newSubject.gradeId}
            onChange={e => setNewSubject({ ...newSubject, gradeId: e.target.value })}>
            <option value="" disabled>Select Grade</option>
            {grades.map(g => <option key={g.id} value={g.id}>Grade {g.name}</option>)}
          </FormInput>
        </div>
      </Modal>
    </div>
  )
}
