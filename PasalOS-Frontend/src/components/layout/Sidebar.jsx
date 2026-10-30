
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
  History,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { hasPermission } from '../../utils/permissions'

const menuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Products', path: '/products', icon: Package, module: 'products' },
  { label: 'Categories', path: '/categories', icon: Tags, module: 'categories' },
  { label: 'Inventory', path: '/inventory', icon: Boxes, module: 'inventory' },
  { label: 'Point of Sale', path: '/pos', icon: ShoppingCart, module: 'pos' },
  { label: 'Sales', path: '/sales', icon: Receipt, module: 'sales' },
  { label: 'Customers', path: '/customers', icon: Users, module: 'customers' },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, module: 'suppliers' },
  { label: 'Purchases', path: '/purchases', icon: ShoppingBag, module: 'purchases' },
  { label: 'Expenses', path: '/expenses', icon: Wallet, module: 'expenses' },
  { label: 'Reports', path: '/reports', icon: BarChart3, module: 'reports' },
  { label: 'Notifications', path: '/notifications', icon: Bell, module: 'notifications' },
  { label: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
  { label: 'Stock History', path: '/stock-history', icon: History, module: 'stockHistory' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const visibleMenuItems = menuItems.filter(({ module }) =>
    hasPermission(user?.role, module, 'view')
  )

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
          {visibleMenuItems.map(({ label, path, icon: Icon }) => (
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
            <p>{user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Account` : 'Business dashboard'}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
