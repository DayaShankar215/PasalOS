import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function DeleteProductModal({
  product,
  onConfirm,
  onClose,
}) {
  if (!product) return null

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
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

        <h2 id="delete-product-title">Delete Product?</h2>

        <p>
          Are you sure you want to delete <strong>{product.name}</strong>?
          This action cannot be undone.
        </p>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => onConfirm(product.id)}
          >
            <Trash2 size={16} />
            Delete Product
          </button>
        </div>
      </section>
    </div>
  )
}