import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-customers'

export function useCustomers() {
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
  }, [customers])

  return [customers, setCustomers]
}