import { BrowserRouter, Routes, Route } from 'react-router-dom'

import DashboardLayout from './components/layout/DashboardLayout'

import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import StockMovementHistory from './pages/StockMovementHistory'
import POS from './pages/POS'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

import { ProductsProvider } from './hooks/useProducts'
import { StockMovementsProvider } from './hooks/useStockMovements'

export default function App() {
  return (
    <BrowserRouter>
      <ProductsProvider>
        <StockMovementsProvider>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />

              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="inventory" element={<Inventory />} />

              <Route
                path="stock-history"
                element={<StockMovementHistory />}
              />

              <Route path="pos" element={<POS />} />
              <Route path="sales" element={<Sales />} />

              <Route path="customers" element={<Customers />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="expenses" element={<Expenses />} />

              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </StockMovementsProvider>
      </ProductsProvider>
    </BrowserRouter>
  )
}