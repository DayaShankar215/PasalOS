import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react'

const STORAGE_KEY = 'pasalos-stock-movements'

const StockMovementsContext = createContext(null)

function loadStockMovements() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return []
    }

    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load stock movements:', error)
    return []
  }
}

export function StockMovementsProvider({ children }) {
  const [movements, setMovements] = useState(loadStockMovements)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(movements)
      )
    } catch (error) {
      console.error('Failed to save stock movements:', error)
    }
  }, [movements])

  return createElement(
    StockMovementsContext.Provider,
    { value: [movements, setMovements] },
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