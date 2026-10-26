// ==========================================
// DASHBOARD DATA
// ==========================================

export const salesData = [
  { day: 'Mon', sales: 12500 },
  { day: 'Tue', sales: 18000 },
  { day: 'Wed', sales: 15000 },
  { day: 'Thu', sales: 22000 },
  { day: 'Fri', sales: 19500 },
  { day: 'Sat', sales: 28500 },
  { day: 'Sun', sales: 24000 },
]

export const initialProducts = [
  {
    id: 1,
    name: 'Basmati Rice 5kg',
    sku: 'GRO-001',
    category: 'Groceries',
    costPrice: 650,
    sellingPrice: 800,
    stock: 45,
    unit: 'Bag',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Coca-Cola 1L',
    sku: 'BEV-001',
    category: 'Beverages',
    costPrice: 100,
    sellingPrice: 130,
    stock: 8,
    unit: 'Bottle',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Lux Soap 100g',
    sku: 'PER-001',
    category: 'Personal Care',
    costPrice: 45,
    sellingPrice: 60,
    stock: 120,
    unit: 'Piece',
    status: 'Active',
  },
  {
    id: 4,
    name: 'LED Bulb 12W',
    sku: 'ELE-001',
    category: 'Electronics',
    costPrice: 180,
    sellingPrice: 250,
    stock: 5,
    unit: 'Piece',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Notebook A4',
    sku: 'STA-001',
    category: 'Stationery',
    costPrice: 70,
    sellingPrice: 100,
    stock: 32,
    unit: 'Piece',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Dishwashing Liquid',
    sku: 'HOU-001',
    category: 'Household',
    costPrice: 90,
    sellingPrice: 120,
    stock: 3,
    unit: 'Bottle',
    status: 'Active',
  },
]

export const stats = [
  {
    title: "Today's Sales",
    value: 28500,
    icon: 'sales',
    change: '+12.5%',
    trend: 'up',
  },
  {
    title: 'Total Revenue',
    value: 245000,
    icon: 'revenue',
    change: '+8.2%',
    trend: 'up',
  },
  {
    title: 'Total Products',
    value: 1248,
    icon: 'products',
    change: '+4.3%',
    trend: 'up',
  },
  {
    title: 'Low Stock Items',
    value: 12,
    icon: 'stock',
    change: 'Needs attention',
    trend: 'down',
  },
]

export const recentTransactions = [
  {
    id: 'INV-1001',
    customer: 'Ram Sharma',
    date: '2026-10-26',
    amount: 4500,
    status: 'Completed',
  },
  {
    id: 'INV-1002',
    customer: 'Sita Thapa',
    date: '2026-10-26',
    amount: 2750,
    status: 'Completed',
  },
  {
    id: 'INV-1003',
    customer: 'Hari Karki',
    date: '2026-10-25',
    amount: 6800,
    status: 'Pending',
  },
  {
    id: 'INV-1004',
    customer: 'Anita Gurung',
    date: '2026-10-25',
    amount: 1950,
    status: 'Completed',
  },
]

export const lowStockProducts = [
  { id: 1, name: 'Coca-Cola 1L', stock: 8, threshold: 10 },
  { id: 2, name: 'LED Bulb 12W', stock: 5, threshold: 10 },
  { id: 3, name: 'Dishwashing Liquid', stock: 3, threshold: 10 },
  { id: 4, name: 'Cooking Oil 1L', stock: 6, threshold: 10 },
]

// ==========================================
// PRODUCTS DATA
// ==========================================

export const productCategories = [
  {
    id: 1,
    name: 'Groceries',
    description: 'Daily food items and essential groceries',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Beverages',
    description: 'Soft drinks, juices, water, and other beverages',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Personal Care',
    description: 'Personal hygiene and grooming products',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Household',
    description: 'Cleaning products and household essentials',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Stationery',
    description: 'Books, notebooks, pens, and office supplies',
    status: 'Active',
  },
]