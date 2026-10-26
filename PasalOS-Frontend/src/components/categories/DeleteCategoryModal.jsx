import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function DeleteCategoryModal({
  category,
  productCount,
  onConfirm,
  onClose,
}) {
  if (!category) return null

  const hasProducts = productCount > 0

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="icon-button delete-modal-close"
          onClick={onClose}
          aria-label="Close confirmation"
        >
          <X size={19} />
        </button>

        <div className="delete-warning-icon">
          <AlertTriangle size={28} />
        </div>

        <h2 id="delete-category-title">
          {hasProducts ? 'Category In Use' : 'Delete Category?'}
        </h2>

        {hasProducts ? (
          <p>
            <strong>{category.name}</strong> currently contains{' '}
            <strong>{productCount}</strong>{' '}
            {productCount === 1 ? 'product' : 'products'}.
            Reassign or remove those products before deleting this category.
          </p>
        ) : (
          <p>
            Are you sure you want to delete <strong>{category.name}</strong>?
            This action cannot be undone.
          </p>
        )}

        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            {hasProducts ? 'Close' : 'Cancel'}
          </button>

          {!hasProducts && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => onConfirm(category.id)}
            >
              <Trash2 size={16} />
              Delete Category
            </button>
          )}
        </div>
      </section>
    </div>
  )
}