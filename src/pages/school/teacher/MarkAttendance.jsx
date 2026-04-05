import { useState, useEffect } from 'react'
import { Check, X, CheckCheck, Calendar } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import FormInput from '../../../components/ui/FormInput'

export default function SchoolTeacherAttendance() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [classes] = useState([]) // TODO: fetch assigned classes

  useEffect(() => {
    // TODO: Fetch students for the selected class from API
    // When students load, initialize attendance:
    // setAttendance(Object.fromEntries(students.map(s => [s.id, 'present'])))
  }, [])

  const toggleAttendance = (id) => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === 'present' ? 'absent' : 'present' }))
  }

  const markAllPresent = () => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, 'present'])))
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Mark Attendance</h1>
        <p className="text-sm text-dark-200 mt-1.5">Mark daily attendance for your class.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-700/60 border border-dark-500/25 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <FormInput type="select" onChange={() => {}}>
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.subject} - Grade {c.grade} - {c.section}</option>
            ))}
          </FormInput>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-dark-800/80 border border-dark-500/40 text-sm text-dark-50 focus:outline-none focus:border-brand-500/50" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" size="md">{presentCount} Present</Badge>
          <Badge variant="danger" size="md">{absentCount} Absent</Badge>
          <button onClick={markAllPresent}
            className="px-3 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4" /> All Present
          </button>
        </div>
      </div>

      <div className="bg-dark-700/60 border border-dark-500/25 rounded-xl overflow-hidden">
        {students.length > 0 ? (
          students.map((student, i) => (
            <div key={student.id}
              className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? 'border-t border-dark-500/20' : ''} hover:bg-dark-600/20 transition-colors`}>
              <div className="flex items-center gap-4">
                <span className="text-xs text-dark-400 w-6 text-center font-mono">{student.rollNo || i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-brand-500/15 flex items-center justify-center text-xs font-bold text-brand-400">
                  {student.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-dark-50">{student.name}</span>
              </div>
              <button onClick={() => toggleAttendance(student.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                  ${attendance[student.id] === 'present'
                    ? 'bg-success/15 text-success border border-success/20 hover:bg-success/25'
                    : 'bg-danger/15 text-danger border border-danger/20 hover:bg-danger/25'
                  }`}>
                {attendance[student.id] === 'present' ? (
                  <><Check className="w-4 h-4" /> Present</>
                ) : (
                  <><X className="w-4 h-4" /> Absent</>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-sm text-dark-400">Select a class to view students.</div>
        )}
      </div>

      {students.length > 0 && (
        <div className="flex justify-end">
          <button className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:shadow-glow transition-all">
            Submit Attendance
          </button>
        </div>
      )}
    </div>
  )
}
