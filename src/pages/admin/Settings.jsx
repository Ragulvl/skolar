import { useState } from 'react'
import { User, Lock, Bell, Save, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminSettings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading">Settings</h1>
        <p className="text-sm text-dark-200 mt-1.5">Manage your admin profile and preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-400" /> Profile Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="text-sm text-dark-300 mb-1.5 block">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="input-base" />
          </div>
          <div>
            <label className="text-sm text-dark-300 mb-1.5 block">Email</label>
            <input type="email" value={formData.email} disabled className="input-base opacity-60 cursor-not-allowed" />
          </div>
        </div>
        <button onClick={handleSave}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium gradient-brand text-white
            hover:opacity-90 transition-opacity flex items-center gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-400" /> Security
        </h3>
        <p className="text-sm text-dark-400">You signed in with Google OAuth. Password management is handled through your Google account.</p>
      </div>

      {/* Notifications */}
      <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {['Pending user approvals', 'New student enrollments', 'Assessment completions'].map((pref, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-dark-800 border-dark-500 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-dark-200">{pref}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
