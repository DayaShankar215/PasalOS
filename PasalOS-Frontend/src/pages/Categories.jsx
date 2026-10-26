import { useMemo, useState } from 'react'
import {
  FolderOpen,
  Tags,
  Package,
  Search,
  Plus,
} from 'lucide-react'

import { productCategories, initialProducts } from '../data/mockData'

import CategoryTable from '../components/categories/CategoryTable'
import CategoryForm from '../components/categories/CategoryForm'
import DeleteCategoryModal from '../components/categories/DeleteCategoryModal'

export default function Categories() {
  const [categories, setCategories] = useState(() =>
    productCategories.map((category) => ({ ...category })),
  )

  const [products] = useState(() =>
    initialProducts.map((product) => ({ ...product })),
  )

  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query),
    )
  }, [categories, search])

  const activeCount = categories.filter(
    (category) => category.status === 'Active',
  ).length

  const totalProducts = products.length

  function openAddForm() {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingCategory(null)
  }

  function saveCategory(formData) {
    if (editingCategory) {
      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingCategory.id
            ? { ...category, ...formData }
            : category,
        ),
      )
    } else {
      setCategories((previous) => [
        ...previous,
        {
          ...formData,
          id: Date.now(),
        },
      ])
    }

    closeForm()
  }

  function confirmDelete(categoryId) {
    setCategories((previous) =>
      previous.filter((category) => category.id !== categoryId),
    )
    setDeletingCategory(null)
  }

  const deletingProductCount = deletingCategory
    ? products.filter(
        (product) => product.category === deletingCategory.name,
      ).length
    : 0

  return (
    <div className="products-page">
      <div className="page-heading products-heading">
        <div>
          <div className="eyebrow">INVENTORY MANAGEMENT</div>
          <h1>Categories</h1>
          <p>Organize and manage your product categories.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="product-summary-grid">
        <div className="product-summary-card">
          <div className="summary-icon summary-icon-blue">
            <FolderOpen size={21} />
          </div>
          <div>
            <p>Total Categories</p>
            <h3>{categories.length}</h3>
            <span>All registered categories</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-green">
            <Tags size={21} />
          </div>
          <div>
            <p>Active Categories</p>
            <h3>{activeCount}</h3>
            <span>Available for use</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-purple">
            <Package size={21} />
          </div>
          <div>
            <p>Total Products</p>
            <h3>{totalProducts}</h3>
            <span>Across all categories</span>
          </div>
        </div>
      </div>

      <section className="panel products-panel">
        <div className="products-panel-header">
          <h2>All Categories</h2>
          <p>
            Showing {filteredCategories.length} of {categories.length} categories
          </p>
        </div>

        <div className="product-filters">
          <div className="product-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <CategoryTable
          categories={filteredCategories}
          products={products}
          onEdit={openEditForm}
          onDelete={setDeletingCategory}
        />
      </section>

      {isFormOpen && (
        <CategoryForm
          category={editingCategory}
          existingCategories={categories}
          onSave={saveCategory}
          onClose={closeForm}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          productCount={deletingProductCount}
          onConfirm={confirmDelete}
          onClose={() => setDeletingCategory(null)}
        />
      )}
    </div>
  )
}