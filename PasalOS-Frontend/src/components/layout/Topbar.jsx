
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const pageNames = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/stock-history': 'Stock Movement History',
  '/pos': 'Point of Sale',
  '/sales': 'Sales',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/purchases': 'Purchases',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
}

const getInitials = (name) => {
  if (!name) return 'U'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  const { user, logout } = useAuth()

  const [profileOpen, setProfileOpen] = useState(false)

  const pageTitle = pageNames[location.pathname] || 'Page'
  const userName = user?.full_name || 'User'
  const userRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User'

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const handleEditProfile = () => {
    setProfileOpen(false)
    navigate('/settings')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <h1>{pageTitle}</h1>
          <p className="breadcrumb">
            Workspace <span>/</span> {pageTitle}
          </p>
        </div>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
          />
          <span className="search-shortcut">/</span>
        </label>

        <button
          type="button"
          className="icon-button notification-button"
          aria-label="View notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-divider" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            className="profile-button"
            onClick={() => setProfileOpen((previous) => !previous)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="avatar">
              {getInitials(userName)}
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>

            <ChevronDown
              size={16}
              className={`transition-transform ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-3 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl z-50"
              role="menu"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800">
                  {userName}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.email || ''}
                </p>
                <span className="inline-block mt-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {userRole}
                </span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleEditProfile}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User size={17} />
                Edit Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings size={17} />
                Settings
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
