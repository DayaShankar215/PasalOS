import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'

const pageTitles = {
  products: 'Products',
  categories: 'Categories',
  inventory: 'Inventory',
  pos: 'Point of Sale',
  sales: 'Sales',
  customers: 'Customers',
  suppliers: 'Suppliers',
  purchases: 'Purchases',
  expenses: 'Expenses',
  reports: 'Reports',
  notifications: 'Notifications',
  settings: 'Settings',
}

function PlaceholderPage({ title }) {
  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">🚧</div>
      <h2>{title}</h2>
      <p>
        The {title.toLowerCase()} module is under development.
        It will be implemented in the next development phase.
      </p>
    </section>
  )
}

function NotFound() {
  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">🔎</div>
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
    </section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          {Object.entries(pageTitles).map(([path, title]) => (
            <Route
              key={path}
              path={path}
              element={<PlaceholderPage title={title} />}
            />
          ))}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}