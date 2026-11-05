import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import productService from "../services/productService";
import categoryService from "../services/categoryService";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = useCallback(async () => {
    try {
      setError("");

      const categoryData = await categoryService.getAll();

      const formattedCategories = categoryData.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description || "",
        productCount: Number(category.product_count ?? 0),
        status: "Active",
      }));

      setCategories(formattedCategories);

      const productData = await productService.getAll(formattedCategories);

      setProducts(productData);
      return productData;
    } catch (err) {
      console.error("Failed to load products:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load products.",
      );

      throw err;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialProducts() {
      try {
        setError("");

        const categoryData = await categoryService.getAll();

        if (!active) return;

        const formattedCategories = categoryData.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description || "",
          productCount: Number(category.product_count ?? 0),
          status: "Active",
        }));

        setCategories(formattedCategories);

        const productData = await productService.getAll(formattedCategories);

        if (active) {
          setProducts(productData);
        }
      } catch (err) {
        console.error("Failed to initialize products:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load products.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialProducts();

    return () => {
      active = false;
    };
  }, []);

  const contextValue = {
    products,
    setProducts,
    categories,
    loading,
    error,
    refreshProducts,
  };

  return createElement(
    ProductsContext.Provider,
    { value: contextValue },
    children,
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used inside ProductsProvider");
  }

  return [context.products, context.setProducts];
}

export function useProductsMeta() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProductsMeta must be used inside ProductsProvider");
  }

  return {
    categories: context.categories,
    loading: context.loading,
    error: context.error,
    refreshProducts: context.refreshProducts,
  };
}
