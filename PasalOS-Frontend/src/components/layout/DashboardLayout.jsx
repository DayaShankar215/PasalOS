import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="main-area">
        <Topbar onMenuClick={openSidebar} />

        <main className="page-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© 2026 PasalOS</span>
          <span>Smart management for smarter businesses.</span>
        </footer>
      </div>
    </div>
  )
}