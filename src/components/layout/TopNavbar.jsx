import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Search, Bell, ChevronRight, Menu } from 'lucide-react'


export default function TopNavbar({ collapsed, onToggleMobile }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: '/' + pathParts.slice(0, i + 1).join('/'),
    isLast: i === pathParts.length - 1,
  }))

  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const notifications = [
    { id: 1, text: '3 pending user approvals', time: '2 min ago', unread: true },
    { id: 2, text: 'New assessment submitted', time: '1 hour ago', unread: true },
    { id: 3, text: 'Attendance report ready', time: '3 hours ago', unread: false },
  ]
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-dark-500/20 bg-dark-800/90 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl hover:bg-dark-700/60 text-dark-300 transition-colors"
            id="mobile-menu-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-dark-500" />}
                {crumb.isLast ? (
                  <span className="text-dark-50 font-semibold">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="text-dark-400 hover:text-dark-200 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right: Search + Bell + Avatar */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-4 h-4 absolute left-3 text-dark-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-12 h-9 rounded-xl bg-dark-700/60 border border-dark-500/30
                text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500
                focus:ring-2 focus:ring-brand-500/15 transition-all"
              id="global-search"
            />
            <kbd className="absolute right-3 text-[10px] text-dark-500 bg-dark-600/50 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2.5 rounded-xl hover:bg-dark-700/60 text-dark-300 hover:text-dark-100 transition-colors"
              id="notification-bell"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-dark-800" />
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-dark-700 border border-dark-500/30 rounded-2xl
                shadow-elevated animate-scale-in overflow-hidden">
                <div className="px-4 py-3.5 border-b border-dark-500/20">
                  <h3 className="font-semibold text-sm text-dark-50">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 hover:bg-dark-600/30 transition-colors cursor-pointer
                      ${n.unread ? 'border-l-2 border-brand-400 bg-brand-500/5' : ''}`}>
                      <p className="text-sm text-dark-100">{n.text}</p>
                      <p className="text-xs text-dark-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-dark-700/60 transition-colors"
              id="avatar-dropdown"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-dark-50 leading-none">{user?.name || 'User'}</p>
                <p className="text-[11px] text-dark-400 leading-none mt-1">{roleLabel}</p>
              </div>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-dark-700 border border-dark-500/30 rounded-2xl
                shadow-elevated animate-scale-in overflow-hidden">
                <div className="px-4 py-3.5 border-b border-dark-500/20">
                  <p className="text-sm font-semibold text-dark-50">{user?.name}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1.5">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-dark-200 hover:bg-dark-600/30 transition-colors">
                    Profile Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
