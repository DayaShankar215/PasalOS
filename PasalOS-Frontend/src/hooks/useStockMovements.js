
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-stock-movements'

export function useStockMovements() {
  const [movements, setMovements] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements))
  }, [movements])

  return [movements, setMovements]
}
