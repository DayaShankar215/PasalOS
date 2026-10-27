import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-suppliers'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const savedSuppliers = localStorage.getItem(STORAGE_KEY)
      return savedSuppliers ? JSON.parse(savedSuppliers) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers))
  }, [suppliers])

  return [suppliers, setSuppliers]
}
