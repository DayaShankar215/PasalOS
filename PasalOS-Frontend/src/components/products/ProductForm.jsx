import { useEffect, useState } from 'react'
import { X, PackagePlus } from 'lucide-react'

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  costPrice: '',
  sellingPrice: '',
  stock: '',
  unit: 'Piece',
  status: 'Active',
}

export default function ProductForm({
  product,
  categories,
  existingProducts,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        costPrice: String(product.costPrice),
        sellingPrice: String(product.sellingPrice),
        stock: String(product.stock),
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [product])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  function validate() {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Product name is required.'
    }

    if (!form.sku.trim()) {
      nextErrors.sku = 'SKU is required.'
    } else {
      const duplicateSKU = existingProducts.some(
        (item) =>
          item.sku.trim().toLowerCase() === form.sku.trim().toLowerCase() &&
          item.id !== product?.id,
      )

      if (duplicateSKU) {
        nextErrors.sku = 'This SKU already exists.'
      }
    }

    if (!form.category) {
      nextErrors.category = 'Please select a category.'
    }

    if (form.costPrice === '' || Number(form.costPrice) < 0) {
      nextErrors.costPrice = 'Enter a valid cost price.'
    }

    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) {
      nextErrors.sellingPrice = 'Enter a valid selling price.'
    }

    if (
      form.stock === '' ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      nextErrors.stock = 'Stock must be a whole number of 0 or more.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!validate()) return

    onSave({
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      stock: Number(form.stock),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card product-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-heading">
            <div className="modal-icon">
              <PackagePlus size={21} />
            </div>

            <div>
              <h2 id="product-form-title">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p>Enter the product information below.</p>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label className="form-field full-width">
              <span>Product Name *</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Basmati Rice 5kg"
              />
              {errors.name && <small>{errors.name}</small>}
            </label>

            <label className="form-field">
              <span>SKU / Product Code *</span>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. GRO-001"
              />
              {errors.sku && <small>{errors.sku}</small>}
            </label>

            <label className="form-field">
              <span>Category *</span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <small>{errors.category}</small>}
            </label>

            <label className="form-field">
              <span>Cost Price (NPR) *</span>
              <input
                type="number"
                name="costPrice"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.costPrice && <small>{errors.costPrice}</small>}
            </label>

            <label className="form-field">
              <span>Selling Price (NPR) *</span>
              <input
                type="number"
                name="sellingPrice"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.sellingPrice && <small>{errors.sellingPrice}</small>}
            </label>

            <label className="form-field">
              <span>Stock Quantity *</span>
              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
              />
              {errors.stock && <small>{errors.stock}</small>}
            </label>

            <label className="form-field">
              <span>Unit</span>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="Piece">Piece</option>
                <option value="Packet">Packet</option>
                <option value="Bottle">Bottle</option>
                <option value="Bag">Bag</option>
                <option value="Box">Box</option>
                <option value="Kg">Kg</option>
                <option value="Liter">Liter</option>
                <option value="Dozen">Dozen</option>
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="product-form-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary">
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}