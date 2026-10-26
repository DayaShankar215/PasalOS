
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-sales'

export function useSales() {
  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
  }, [sales])

  return [sales, setSales]
}
