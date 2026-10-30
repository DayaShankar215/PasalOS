
export const rolePermissions = {
  owner: {
    dashboard: 'full',
    products: 'full',
    categories: 'full',
    inventory: 'full',
    stockHistory: 'view',
    pos: 'full',
    sales: 'full',
    customers: 'full',
    suppliers: 'full',
    purchases: 'full',
    expenses: 'full',
    reports: 'full',
    notifications: 'full',
    settings: 'full',
    users: 'full',
  },

  manager: {
    dashboard: 'full',
    products: 'full',
    categories: 'full',
    inventory: 'full',
    stockHistory: 'view',
    pos: 'full',
    sales: 'full',
    customers: 'full',
    suppliers: 'full',
    purchases: 'full',
    expenses: 'full',
    reports: 'full',
    notifications: 'full',
    settings: 'none',
    users: 'none',
  },

  cashier: {
    dashboard: 'none',
    products: 'view',
    categories: 'view',
    inventory: 'view',
    stockHistory: 'view',
    pos: 'full',
    sales: 'full',
    customers: 'full',
    suppliers: 'none',
    purchases: 'none',
    expenses: 'none',
    reports: 'none',
    notifications: 'full',
    settings: 'none',
    users: 'none',
  },
}

export const hasPermission = (role, module, required = 'view') => {
  const permission = rolePermissions[role]?.[module] || 'none'

  if (required === 'view') {
    return permission === 'view' || permission === 'full'
  }

  if (required === 'full') {
    return permission === 'full'
  }

  return false
}
