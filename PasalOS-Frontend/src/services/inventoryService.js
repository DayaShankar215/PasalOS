import api from './api'

export const getStockMovements = async (filters = {}) => {
  const response = await api.get('/stock-movements', {
    params: filters,
  })

  return response.data.data || []
}

export const adjustStock = async (adjustmentData) => {
  const response = await api.post(
    '/stock-movements/adjust',
    adjustmentData
  )

  return response.data
}