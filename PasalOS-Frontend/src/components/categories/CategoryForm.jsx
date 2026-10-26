import { useEffect, useState } from 'react'
import { FolderPlus, X } from 'lucide-react'

export default function CategoryForm({
  category,
  existingCategories,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'Active',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(
      category
        ? {
            name: category.name,
            description: category.description || '',
            status: category.status || 'Active',
          }
        : {
            name: '',
            description: '',
            status: 'Active',
          },
    )

    setErrors({})
  }, [category])

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

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Category name is required.'
    } else {
      const duplicate = existingCategories.some(
        (item) =>
          item.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
          item.id !== category?.id,
      )

      if (duplicate) {
        nextErrors.name = 'This category already exists.'
      }
    }

    if (form.name.trim().length > 50) {
      nextErrors.name = 'Category name must be 50 characters or fewer.'
    }

    if (form.description.trim().length > 200) {
      nextErrors.description = 'Description must be 200 characters or fewer.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card category-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-heading">
            <div className="modal-icon">
              <FolderPlus size={21} />
            </div>

            <div>
              <h2 id="category-form-title">
                {category ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p>Organize your products into categories.</p>
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
          <div className="category-form-fields">
            <label className="form-field">
              <span>Category Name *</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Groceries"
                maxLength={50}
                autoFocus
              />
              {errors.name && <small>{errors.name}</small>}
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Briefly describe this category..."
                rows={4}
                maxLength={200}
              />
              {errors.description && (
                <small>{errors.description}</small>
              )}
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
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
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}