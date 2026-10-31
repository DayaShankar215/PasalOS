
import { useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Tags,
  CircleDollarSign,
  Plus,
  Download,
} from "lucide-react";

import { productCategories } from "../data/mockData";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";

import { hasPermission } from "../utils/permissions";
import { formatCurrency } from "../utils/currency";

import ProductTable from "../components/products/ProductTable";
import ProductForm from "../components/products/ProductForm";
import ProductFilters from "../components/products/ProductFilters";
import DeleteProductModal from "../components/products/DeleteProductModal";

export default function Products() {
  const [products, setProducts] = useProducts();
  const { user } = useAuth();

  // Permission check
  const canManageProducts = hasPermission(
    user?.role,
    "products",
    "full"
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // Product summary calculations
  const totalInventoryValue = products.reduce(
    (total, product) =>
      total + product.costPrice * product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock <= 10
  ).length;

  // Open add product form
  function openAddForm() {
    if (!canManageProducts) return;

    setEditingProduct(null);
    setIsFormOpen(true);
  }

  // Open edit product form
  function openEditForm(product) {
    if (!canManageProducts) return;

    setEditingProduct(product);
    setIsFormOpen(true);
  }

  // Close product form
  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  // Save product
  function saveProduct(formData) {
    if (!canManageProducts) return;

    if (editingProduct) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editingProduct.id
            ? { ...product, ...formData }
            : product
        )
      );
    } else {
      const newProduct = {
        ...formData,
        id: Date.now(),
      };

      setProducts((previous) => [
        newProduct,
        ...previous,
      ]);
    }

    closeForm();
  }

  // Open delete confirmation
  function openDeleteModal(product) {
    if (!canManageProducts) return;

    setDeletingProduct(product);
  }

  // Confirm product deletion
  function confirmDelete(productId) {
    if (!canManageProducts) return;

    setProducts((previous) =>
      previous.filter(
        (product) => product.id !== productId
      )
    );

    setDeletingProduct(null);
  }

  // Export products to CSV
  function exportCSV() {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Cost Price",
      "Selling Price",
      "Stock",
      "Unit",
      "Status",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = filteredProducts.map((product) =>
      [
        product.name,
        product.sku,
        product.category,
        product.costPrice,
        product.sellingPrice,
        product.stock,
        product.unit,
        product.status,
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows,
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pasalos-products.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="products-page">

      {/* Page Heading */}
      <div className="page-heading products-heading">
        <div>
          <div className="eyebrow">
            INVENTORY MANAGEMENT
          </div>

          <h1>Products</h1>

          <p>
            Manage your products, pricing, and stock levels.
          </p>
        </div>

        <div className="products-heading-actions">

          <button
            type="button"
            className="btn-secondary"
            onClick={exportCSV}
          >
            <Download size={17} />
            Export CSV
          </button>

          {canManageProducts && (
            <button
              type="button"
              className="btn-primary"
              onClick={openAddForm}
            >
              <Plus size={18} />
              Add Product
            </button>
          )}

        </div>
      </div>

      {/* Product Summary */}
      <div className="product-summary-grid">

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-blue">
            <Package size={21} />
          </div>

          <div>
            <p>Total Products</p>
            <h3>{products.length}</h3>
            <span>Registered products</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-orange">
            <AlertTriangle size={21} />
          </div>

          <div>
            <p>Low Stock Items</p>
            <h3>{lowStockCount}</h3>
            <span>10 units or fewer</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-purple">
            <Tags size={21} />
          </div>

          <div>
            <p>Categories</p>
            <h3>
              {new Set(
                products.map((product) => product.category)
              ).size}
            </h3>
            <span>Categories in use</span>
          </div>
        </div>

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-green">
            <CircleDollarSign size={21} />
          </div>

          <div>
            <p>Stock Cost Value</p>
            <h3>
              {formatCurrency(totalInventoryValue)}
            </h3>
            <span>Cost price × stock</span>
          </div>
        </div>

      </div>

      {/* Products Table */}
      <section className="panel products-panel">

        <div className="products-panel-header">
          <div>
            <h2>All Products</h2>

            <p>
              Showing {filteredProducts.length} of{" "}
              {products.length} products
            </p>
          </div>
        </div>

        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={productCategories.map(
            (item) => item.name
          )}
          onAddProduct={openAddForm}
          canManageProducts={canManageProducts}
        />

        <ProductTable
          products={filteredProducts}
          onEdit={openEditForm}
          onDelete={openDeleteModal}
          canManageProducts={canManageProducts}
        />

      </section>

      {/* Add / Edit Product Modal */}
      {canManageProducts && isFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={productCategories}
          existingProducts={products}
          onSave={saveProduct}
          onClose={closeForm}
        />
      )}

      {/* Delete Product Confirmation */}
      {canManageProducts && deletingProduct && (
        <DeleteProductModal
          product={deletingProduct}
          onConfirm={confirmDelete}
          onClose={() => setDeletingProduct(null)}
        />
      )}

    </div>
  );
}
