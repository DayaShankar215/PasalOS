import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pasalos-expenses'

export function useExpenses() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const savedExpenses = localStorage.getItem(STORAGE_KEY)
      return savedExpenses ? JSON.parse(savedExpenses) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  return [expenses, setExpenses]
}