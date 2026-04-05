import { useState } from 'react'
import {
  Settings, Save, Loader2, Shield, CheckCircle2,
  AlertTriangle, ToggleLeft, ToggleRight, Hash, Type, Clock
} from 'lucide-react'
import useAPI from '../../hooks/useAPI'
import api from '../../api/client'

const SETTING_META = {
  platform_name: {
    label: 'Platform Name',
    description: 'The display name of the platform.',
    icon: Type,
    type: 'text',
  },
  allow_signups: {
    label: 'Allow New Signups',
    description: 'When disabled, new users cannot register on the platform.',
    icon: Shield,
    type: 'toggle',
  },
  maintenance_mode: {
    label: 'Maintenance Mode',
    description: 'When enabled, the platform shows a maintenance page to non-admin users.',
    icon: AlertTriangle,
    type: 'toggle',
    danger: true,
  },
  max_institutions_per_admin: {
    label: 'Max Institutions Per Admin',
    description: 'Maximum number of institutions an admin can be assigned to.',
    icon: Hash,
    type: 'number',
  },
  default_pending_timeout_days: {
    label: 'Pending Timeout (Days)',
    description: 'Number of days before a pending user account is auto-flagged.',
    icon: Clock,
    type: 'number',
  },
}

export default function SuperAdminSettings() {
  const { data: cachedSettings, loading: initialLoading } = useAPI('/superadmin/settings', { staleTime: 120_000 })
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Initialize local state from cached data
  const displaySettings = settings ?? cachedSettings ?? {}
  const loading = initialLoading && !cachedSettings

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...(prev ?? displaySettings), [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/superadmin/settings', displaySettings)
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-dark-700/40 rounded-lg" />
        <div className="h-4 w-72 bg-dark-700/40 rounded-lg" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-dark-700/40 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading">Platform Settings</h1>
          <p className="text-sm text-dark-200 mt-1.5">Configure global platform behavior.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all
            ${dirty
              ? 'gradient-brand text-white hover:shadow-glow'
              : saved
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-dark-700/60 text-dark-400 border border-dark-500/25'
            } disabled:opacity-50`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {Object.entries(SETTING_META).map(([key, meta]) => {
          const value = displaySettings[key] || ''

          return (
            <div key={key}
              className={`bg-dark-700/60 border rounded-2xl p-6 transition-all
                ${meta.danger ? 'border-red-500/20' : 'border-dark-500/25'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${meta.danger ? 'bg-red-500/15' : 'bg-brand-500/15'}`}>
                    <meta.icon className={`w-5 h-5 ${meta.danger ? 'text-red-400' : 'text-brand-400'}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${meta.danger ? 'text-red-300' : 'text-dark-50'}`}>
                      {meta.label}
                    </h3>
                    <p className="text-xs text-dark-400 mt-0.5">{meta.description}</p>
                  </div>
                </div>

                {/* Control */}
                <div className="shrink-0">
                  {meta.type === 'toggle' ? (
                    <button
                      onClick={() => handleChange(key, value === 'true' ? 'false' : 'true')}
                      className="focus:outline-none"
                    >
                      {value === 'true' ? (
                        <ToggleRight className={`w-10 h-10 ${meta.danger ? 'text-red-400' : 'text-brand-400'}`} />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-dark-500" />
                      )}
                    </button>
                  ) : meta.type === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={e => handleChange(key, e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20
                        text-sm text-dark-100 text-center focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={e => handleChange(key, e.target.value)}
                      className="w-48 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-500/20
                        text-sm text-dark-100 focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-dark-700/40 border border-dark-500/15 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-dark-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-dark-300">
              Settings are applied immediately after saving. Some settings (like maintenance mode) may affect 
              all active user sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
