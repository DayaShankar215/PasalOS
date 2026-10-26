
import { useEffect, useState } from 'react'
import { initialProducts } from '../data/mockData'

const STORAGE_KEY = 'pasalos-products'

export function useProducts() {
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEY)
      return savedProducts
        ? JSON.parse(savedProducts)
        : initialProducts
    } catch {
      return initialProducts
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  return [products, setProducts]
}
