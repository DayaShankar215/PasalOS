import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react'
import { initialProducts } from '../data/mockData'

const STORAGE_KEY = 'pasalos-products'

const ProductsContext = createContext(null)

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY)

    return savedProducts
      ? JSON.parse(savedProducts)
      : initialProducts
  } catch {
    return initialProducts
  }
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(loadProducts)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch (error) {
      console.error('Unable to save products:', error)
    }
  }, [products])

  return createElement(
    ProductsContext.Provider,
    { value: [products, setProducts] },
    children
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)

  if (!context) {
    throw new Error(
      'useProducts must be used inside ProductsProvider'
    )
  }

  return context
}
