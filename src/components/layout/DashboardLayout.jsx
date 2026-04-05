import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'

export default function DashboardLayout({ role, institutionType }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:block">
        <Sidebar
          role={role}
          institutionType={institutionType}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Sidebar — mobile */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          role={role}
          institutionType={institutionType}
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        <TopNavbar
          collapsed={collapsed}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-5 lg:p-8 animate-fade-in">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
