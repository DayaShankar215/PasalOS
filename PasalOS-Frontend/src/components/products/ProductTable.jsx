import { Edit2, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

export default function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="products-empty">
        <Package size={42} />
        <h3>No products found</h3>
        <p>Try another search or category, or add a new product.</p>
      </div>
    )
  }

  return (
    <div className="table-container products-table-container">
      <table className="data-table products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Cost Price</th>
            <th>Selling Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-name-cell">
                  <div className="product-avatar">
                    <Package size={19} />
                  </div>
                  <div>
                    <span className="product-name">{product.name}</span>
                    <span className="product-unit">{product.unit}</span>
                  </div>
                </div>
              </td>

              <td>
                <span className="product-sku">{product.sku}</span>
              </td>

              <td>{product.category}</td>

              <td>{formatCurrency(product.costPrice)}</td>

              <td className="selling-price">
                {formatCurrency(product.sellingPrice)}
              </td>

              <td>
                <span
                  className={`stock-badge ${
                    product.stock <= 5
                      ? 'stock-critical'
                      : product.stock <= 10
                        ? 'stock-low'
                        : 'stock-good'
                  }`}
                >
                  {product.stock} {product.unit.toLowerCase()}(s)
                </span>
              </td>

              <td>
                <span className="status-badge">
                  <span className="status-dot" />
                  {product.status}
                </span>
              </td>

              <td>
                <div className="product-actions">
                  <button
                    type="button"
                    className="icon-button edit-button"
                    onClick={() => onEdit(product)}
                    title="Edit product"
                    aria-label={`Edit ${product.name}`}
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button delete-button"
                    onClick={() => onDelete(product)}
                    title="Delete product"
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}