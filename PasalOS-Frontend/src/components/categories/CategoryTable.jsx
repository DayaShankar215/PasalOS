import { Edit2, Trash2, FolderOpen, Package } from "lucide-react";

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
  canManageCategories = false,
}) {
  // Empty categories state
  if (categories.length === 0) {
    return (
      <div className="products-empty">
        <FolderOpen size={42} />
        <h3>No categories found</h3>
        <p>Try a different search or create a new category.</p>
      </div>
    );
  }

  return (
    <div className="table-container products-table-container">
      <table className="data-table products-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Products</th>
            <th>Status</th>

            {canManageCategories && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => {
            // Product count comes directly from the backend
            const productCount = Number(category.productCount ?? 0);

            return (
              <tr key={category.id}>
                {/* Category Name */}
                <td>
                  <div className="product-name-cell">
                    <div className="product-avatar category-avatar">
                      <Package size={19} />
                    </div>

                    <div>
                      <span className="product-name">{category.name}</span>

                      <span className="product-unit">
                        CAT-{String(category.id).padStart(3, "0")}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td className="category-description">
                  {category.description || "—"}
                </td>

                {/* Product Count */}
                <td>
                  <span className="category-product-count">
                    {productCount} {productCount === 1 ? "product" : "products"}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className="status-badge">
                    <span className="status-dot" />
                    Active
                  </span>
                </td>

                {/* Actions */}
                {canManageCategories && (
                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="icon-button edit-button"
                        onClick={() => onEdit(category)}
                        title="Edit category"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => onDelete(category)}
                        title="Delete category"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
