import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  ShoppingBag,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  Store,
  X,
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: Tags },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Point of Sale', path: '/pos', icon: ShoppingCart },
  { label: 'Sales', path: '/sales', icon: Receipt },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Suppliers', path: '/suppliers', icon: Truck },
  { label: 'Purchases', path: '/purchases', icon: ShoppingBag },
  { label: 'Expenses', path: '/expenses', icon: Wallet },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Store size={24} />
          </div>

          <div className="brand-text">
            <h2>PasalOS</h2>
            <span>Smart Business Management</span>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {menuItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>

              {label === 'Notifications' && (
                <span className="notification-count">3</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <Store size={20} />
          </div>

          <div>
            <strong>PasalOS Starter</strong>
            <p>Business dashboard</p>
          </div>
        </div>
      </aside>
    </>
  )
}