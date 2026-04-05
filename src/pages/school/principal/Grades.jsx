import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, Users } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import FormInput from '../../../components/ui/FormInput'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/client'

const categoryLabels = { early: 'Early Years', primary: 'Primary', middle: 'Middle School', high: 'High School', higher_sec: 'Higher Secondary' }
const categoryColors = { early: 'brand', primary: 'info', middle: 'violet', high: 'warning', higher_sec: 'success' }

function getCategory(name) {
  if (['PreKG', 'LKG', 'UKG'].includes(name)) return 'early'
  if (['1', '2', '3', '4'].includes(name)) return 'primary'
  if (['5', '6', '7'].includes(name)) return 'middle'
  if (['8', '9', '10'].includes(name)) return 'high'
  if (['11', '12'].includes(name)) return 'higher_sec'
  return 'primary'
}

export default function SchoolPrincipalGrades() {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState({})
  const [showAddSection, setShowAddSection] = useState(false)
  const [selectedGradeId, setSelectedGradeId] = useState(null)
  const [sectionName, setSectionName] = useState('')
  const [grades, setGrades] = useState([])
  const [creating, setCreating] = useState(false)

  const institutionId = user?.institutionId

  const fetchGrades = () => {
    if (!institutionId) return
    api.get(`/school/grades/${institutionId}`)
      .then(res => setGrades(res.data.data || []))
      .catch(() => {})
  }

  useEffect(() => { fetchGrades() }, [institutionId])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const grouped = Object.entries(categoryLabels).map(([key, label]) => ({
    key, label,
    grades: grades.filter(g => getCategory(g.name) === key)
  })).filter(g => g.grades.length > 0)

  const handleCreateSection = async () => {
    if (!sectionName || !selectedGradeId) return
    setCreating(true)
    try {
      await api.post('/school/sections', { name: sectionName, gradeId: selectedGradeId, institutionId })
      setShowAddSection(false)
      setSectionName('')
      fetchGrades()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create section')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Grades & Sections</h1>
        <p className="text-sm text-dark-200 mt-1.5">Manage all grades with their sections.</p>
      </div>

      {grouped.length > 0 ? (
        grouped.map(group => (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={categoryColors[group.key]} size="md">{group.label}</Badge>
              <span className="text-xs text-dark-400">{group.grades.length} grades</span>
            </div>
            <div className="space-y-2">
              {group.grades.map(grade => (
                <div key={grade.id} className="bg-dark-700/60 border border-dark-500/25 rounded-xl overflow-hidden">
                  <button onClick={() => toggle(grade.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-dark-600/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {expanded[grade.id] ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                      <span className="font-semibold text-dark-50 font-heading">Grade {grade.name}</span>
                      <Badge variant="neutral" size="sm">{(grade.sections || []).length} sections</Badge>
                      <span className="text-xs text-dark-400">{(grade.sections || []).reduce((s, sec) => s + (sec._count?.users || 0), 0)} students</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedGradeId(grade.id); setShowAddSection(true) }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Section
                    </button>
                  </button>
                  {expanded[grade.id] && (
                    <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-slide-down">
                      {(grade.sections || []).map(sec => (
                        <div key={sec.id} className="px-4 py-3 rounded-lg bg-dark-800/50 border border-dark-500/20 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-dark-50">Section {sec.name}</p>
                            <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" /> {sec._count?.users || 0} students
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-sm text-dark-400">No grades found for this institution.</div>
      )}

      <Modal isOpen={showAddSection} onClose={() => setShowAddSection(false)} title="Add Section" size="sm"
        footer={<>
          <button onClick={() => setShowAddSection(false)}
            className="px-4 py-2 rounded-lg text-sm text-dark-200 hover:bg-dark-600/60 border border-dark-500/40">Cancel</button>
          <button onClick={handleCreateSection} disabled={creating || !sectionName}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium disabled:opacity-50">
            {creating ? 'Adding...' : 'Add Section'}
          </button>
        </>}>
        <FormInput label="Section Name" placeholder="e.g., D" required
          value={sectionName} onChange={e => setSectionName(e.target.value)} />
      </Modal>
    </div>
  )
}
