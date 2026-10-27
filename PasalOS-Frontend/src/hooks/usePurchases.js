import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-purchases'

export function usePurchases() {
  const [purchases, setPurchases] = useState(() => {
    try {
      const savedPurchases = localStorage.getItem(STORAGE_KEY)
      return savedPurchases ? JSON.parse(savedPurchases) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases))
  }, [purchases])

  return [purchases, setPurchases]
}