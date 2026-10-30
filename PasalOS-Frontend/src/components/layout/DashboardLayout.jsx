
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Logout {user?.full_name ? `(${user.full_name})` : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}
