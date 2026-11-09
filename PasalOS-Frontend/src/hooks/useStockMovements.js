import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { getStockMovements } from '../services/inventoryService'

const StockMovementsContext = createContext(null)

export function StockMovementsProvider({ children }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshMovements = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError('')

      const data = await getStockMovements(filters)

      setMovements(data)
      return data
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to load stock movements.'

      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMovements().catch(() => {
      // Error is stored in context for the UI.
    })
  }, [refreshMovements])

  const value = {
    movements,
    loading,
    error,
    refreshMovements,
  }

  return createElement(
    StockMovementsContext.Provider,
    { value },
    children
  )
}

export function useStockMovements() {
  const context = useContext(StockMovementsContext)

  if (!context) {
    throw new Error(
      'useStockMovements must be used inside StockMovementsProvider'
    )
  }

  return context
}