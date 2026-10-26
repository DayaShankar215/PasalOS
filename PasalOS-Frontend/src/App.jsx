import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import StockMovementHistory from "./pages/StockMovementHistory";
import Sales from './pages/Sales'
import POS from "./pages/POS";

const pageTitles = {
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  pos: "Point of Sale",
  sales: "Sales",
  customers: "Customers",
  suppliers: "Suppliers",
  purchases: "Purchases",
  expenses: "Expenses",
  reports: "Reports",
  notifications: "Notifications",
  settings: "Settings",
};

function PlaceholderPage({ title }) {
  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">🚧</div>
      <h2>{title}</h2>
      <p>
        The {title.toLowerCase()} module is under development. It will be
        implemented in the next development phase.
      </p>
    </section>
  );
}

function NotFound() {
  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">🔎</div>
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          {Object.entries(pageTitles)
            .filter(
              ([path]) =>
                !["products", "categories", "inventory", "stock-history","pos", "sales"].includes(path),
            )
            .map(([path, title]) => (
              <Route
                key={path}
                path={path}
                element={<PlaceholderPage title={title} />}
              />
            ))}

          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="stock-history" element={<StockMovementHistory />} />
          <Route path="pos" element={<POS />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sales" element={<Sales />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
