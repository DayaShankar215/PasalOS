
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Authentication
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
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
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

// Global state providers
import { ProductsProvider } from './hooks/useProducts'
import { StockMovementsProvider } from './hooks/useStockMovements'


// Redirect authenticated users away from Login and Register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return children
  }

  const redirectPath =
    user?.role === 'cashier' ? '/pos' : '/'

  return <Navigate to={redirectPath} replace />
}


// Redirect authenticated users to their appropriate home page
const HomeRedirect = () => {
  const { user } = useAuth()

  const homePath =
    user?.role === 'cashier' ? '/pos' : '/'

  return <Navigate to={homePath} replace />
}


// Main application routes
const AppRoutes = () => {
  return (
    <Routes>

      {/* ======================================
          PUBLIC ROUTES
      ====================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />


      {/* ======================================
          PROTECTED ROUTES
      ====================================== */}

      <Route element={<ProtectedRoute />}>

        {/* Unauthorized page */}
        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* Main dashboard layout */}
        <Route element={<DashboardLayout />}>

          {/* Home route */}
          <Route
            index
            element={<HomeRedirect />}
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              <PermissionRoute module="dashboard">
                <Dashboard />
              </PermissionRoute>
            }
          />

          {/* Products */}
          <Route
            path="products"
            element={
              <PermissionRoute module="products">
                <Products />
              </PermissionRoute>
            }
          />

          {/* Categories */}
          <Route
            path="categories"
            element={
              <PermissionRoute module="categories">
                <Categories />
              </PermissionRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="inventory"
            element={
              <PermissionRoute module="inventory">
                <Inventory />
              </PermissionRoute>
            }
          />

          {/* Stock Movement History */}
          <Route
            path="stock-history"
            element={
              <PermissionRoute module="stockHistory">
                <StockMovementHistory />
              </PermissionRoute>
            }
          />

          {/* Point of Sale */}
          <Route
            path="pos"
            element={
              <PermissionRoute module="pos">
                <POS />
              </PermissionRoute>
            }
          />

          {/* Sales */}
          <Route
            path="sales"
            element={
              <PermissionRoute module="sales">
                <Sales />
              </PermissionRoute>
            }
          />

          {/* Customers */}
          <Route
            path="customers"
            element={
              <PermissionRoute module="customers">
                <Customers />
              </PermissionRoute>
            }
          />

          {/* Suppliers */}
          <Route
            path="suppliers"
            element={
              <PermissionRoute module="suppliers">
                <Suppliers />
              </PermissionRoute>
            }
          />

          {/* Purchases */}
          <Route
            path="purchases"
            element={
              <PermissionRoute module="purchases">
                <Purchases />
              </PermissionRoute>
            }
          />

          {/* Expenses */}
          <Route
            path="expenses"
            element={
              <PermissionRoute module="expenses">
                <Expenses />
              </PermissionRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <PermissionRoute module="reports">
                <Reports />
              </PermissionRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="notifications"
            element={
              <PermissionRoute module="notifications">
                <Notifications />
              </PermissionRoute>
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <PermissionRoute module="settings">
                <Settings />
              </PermissionRoute>
            }
          />

          {/* Page not found */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>
      </Route>

    </Routes>
  )
}


// Root application
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <StockMovementsProvider>
            <AppRoutes />
          </StockMovementsProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
