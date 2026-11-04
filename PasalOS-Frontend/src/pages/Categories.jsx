import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Tags, Package, Search, Plus } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permissions";

import categoryService from "../services/categoryService";

import CategoryTable from "../components/categories/CategoryTable";
import CategoryForm from "../components/categories/CategoryForm";
import DeleteCategoryModal from "../components/categories/DeleteCategoryModal";

export default function Categories() {
  const { user } = useAuth();

  const canManageCategories = hasPermission(user?.role, "categories", "full");

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Load categories from MySQL
  async function fetchCategories() {
    try {
      setError("");

      const data = await categoryService.getAll();

      const formattedCategories = data.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description || "",
        productCount: Number(category.product_count ?? 0),

        // The current database does not have a status column.
        status: "Active",
      }));

      setCategories(formattedCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load categories. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query),
    );
  }, [categories, search]);

  // Summary calculations
  const activeCount = categories.length;

  const totalProducts = categories.reduce(
    (total, category) => total + category.productCount,
    0,
  );

  // Open add form
  function openAddForm() {
    if (!canManageCategories) return;

    setEditingCategory(null);
    setIsFormOpen(true);
  }

  // Open edit form
  function openEditForm(category) {
    if (!canManageCategories) return;

    setEditingCategory(category);
    setIsFormOpen(true);
  }

  // Close form
  function closeForm() {
    setIsFormOpen(false);
    setEditingCategory(null);
  }

  // Create or update category
  async function saveCategory(formData) {
    if (!canManageCategories || saving) return;

    try {
      setSaving(true);
      setError("");

      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
      } else {
        await categoryService.create(formData);
      }

      await fetchCategories();
      closeForm();
    } catch (err) {
      console.error("Failed to save category:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Open delete confirmation
  function openDeleteModal(category) {
    if (!canManageCategories) return;

    setDeletingCategory(category);
  }

  // Delete category
  async function confirmDelete(categoryId) {
    if (!canManageCategories || saving) return;

    try {
      setSaving(true);
      setError("");

      await categoryService.delete(categoryId);

      await fetchCategories();
      setDeletingCategory(null);
    } catch (err) {
      console.error("Failed to delete category:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Actual product count from the backend
  const deletingProductCount = deletingCategory
    ? deletingCategory.productCount
    : 0;

  return (
    <div className="products-page">
      {/* Page Heading */}
      <div className="page-heading products-heading">
        <div>
          <div className="eyebrow">INVENTORY MANAGEMENT</div>

          <h1>Categories</h1>

          <p>Organize and manage your product categories.</p>
        </div>

        {canManageCategories && (
          <button type="button" className="btn-primary" onClick={openAddForm}>
            <Plus size={18} />
            Add Category
          </button>
        )}
      </div>

      {/* API Error */}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Category Summary */}
      <div className="product-summary-grid">
        <div className="product-summary-card">
          <div className="summary-icon summary-icon-blue">
            <FolderOpen size={21} />
          </div>

          <div>
            <p>Total Categories</p>
            <h3>{loading ? "..." : categories.length}</h3>
            <span>All registered categories</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-green">
            <Tags size={21} />
          </div>

          <div>
            <p>Available Categories</p>
            <h3>{loading ? "..." : activeCount}</h3>
            <span>Categories registered in the database</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-purple">
            <Package size={21} />
          </div>

          <div>
            <p>Total Products</p>
            <h3>{loading ? "..." : totalProducts}</h3>
            <span>Products assigned to categories</span>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <section className="panel products-panel">
        <div className="products-panel-header">
          <div>
            <h2>All Categories</h2>

            <p>
              Showing {filteredCategories.length} of {categories.length}{" "}
              categories
            </p>
          </div>
        </div>

        {/* Search */}
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

        {/* Table */}
        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : (
          <CategoryTable
            categories={filteredCategories}
            onEdit={openEditForm}
            onDelete={openDeleteModal}
            canManageCategories={canManageCategories}
          />
        )}
      </section>

      {/* Add / Edit Category */}
      {canManageCategories && isFormOpen && (
        <CategoryForm
          category={editingCategory}
          existingCategories={categories}
          onSave={saveCategory}
          onClose={closeForm}
        />
      )}

      {/* Delete Confirmation */}
      {canManageCategories && deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          productCount={deletingProductCount}
          onConfirm={confirmDelete}
          onClose={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
