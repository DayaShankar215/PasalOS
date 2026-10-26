import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { lowStockProducts } from '../../data/mockData'

export default function LowStockList() {
  return (
    <section className="panel low-stock-panel">
      <div className="panel-heading">
        <div>
          <h3>Low Stock Alerts</h3>
          <p>Products that need restocking</p>
        </div>

        <span className="stock-badge">{lowStockProducts.length} items</span>
      </div>

      <div className="stock-list">
        {lowStockProducts.map((product) => (
          <div className="stock-item" key={product.id}>
            <div className="stock-product-icon">
              <AlertTriangle size={18} />
            </div>

            <div className="stock-product-details">
              <strong>{product.name}</strong>
              <span>{product.category}</span>
            </div>

            <div className="stock-quantity">
              <strong>{product.stock}</strong>
              <span>left</span>
            </div>
          </div>
        ))}
      </div>

      <Link to="/inventory" className="panel-link">
        View inventory <ArrowRight size={16} />
      </Link>
    </section>
  )
}