import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { School, ChevronLeft, LogOut, PanelLeft } from 'lucide-react'
import sidebarConfig from './sidebarConfig'

export default function Sidebar({ role, institutionType, collapsed, onToggle }) {
  const { user, logout } = useAuth()

  let config = sidebarConfig[role]
  if (config && !config.links && institutionType) {
    config = config[institutionType]
  }

  if (!config) return null

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col
        bg-dark-800 border-r border-dark-500/20 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-dark-500/20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-glow">
            <School className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold font-heading gradient-text leading-none">Skolar</h1>
              <p className="text-[10px] text-dark-400 mt-1 font-medium uppercase tracking-wider">{config.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {config.links.map((link) => (
          <NavLink
            key={link.to}
            to={config.basePath + link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-brand-500/12 text-brand-400 shadow-[inset_3px_0_0_var(--color-brand-500)]'
                : 'text-dark-300 hover:bg-dark-700/60 hover:text-dark-100'
              }`
            }
            title={collapsed ? link.label : undefined}
          >
            <link.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="animate-fade-in truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-dark-500/20 p-3 space-y-1 shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-2.5 mb-1 animate-fade-in flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark-50 truncate">{user.name}</p>
              <p className="text-xs text-dark-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-dark-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-dark-400 hover:bg-dark-700/60 hover:text-dark-100 transition-all duration-200 w-full"
        >
          {collapsed ? (
            <PanelLeft className="w-[18px] h-[18px] shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
