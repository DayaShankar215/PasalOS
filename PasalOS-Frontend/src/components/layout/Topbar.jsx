import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react'

const pageNames = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
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

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle = pageNames[location.pathname] || 'Page'

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

        <button
          type="button"
          className="profile-button"
          aria-label="Admin user profile"
        >
          <div className="avatar">DA</div>

          <div className="profile-info">
            <strong>Admin User</strong>
            <span>Store Manager</span>
          </div>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  )
}