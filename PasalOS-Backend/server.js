require('dotenv').config()

const express = require('express')
const cors = require('cors')
const pool = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())

// Basic API route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PasalOS API',
    status: 'Server is running',
  })
})

// MySQL health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')

    res.json({
      status: 'OK',
      server: 'Running',
      database: 'Connected',
    })
  } catch (error) {
    console.error('Database health check failed:', error.message)

    res.status(503).json({
      status: 'ERROR',
      server: 'Running',
      database: 'Disconnected',
    })
  }
})

// Products API
app.use('/api/products', require('./routes/products'))

// Categories API
app.use('/api/categories', require('./routes/categories'))

// Customers API
app.use('/api/customers', require('./routes/customers'))

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`PasalOS API running at http://localhost:${PORT}`)
})