import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  onAddProduct,
}) {
  return (
    <div className="product-filters">
      <div className="product-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {search && (
          <button
            type="button"
            className="clear-search"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filter-actions">
        <div className="category-filter">
          <SlidersHorizontal size={16} />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={onAddProduct}
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>
    </div>
  )
}