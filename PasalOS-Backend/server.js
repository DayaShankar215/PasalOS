
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const pool = require('./config/db')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PasalOS API',
    status: 'Server is running',
  })
})

// Health check: test the MySQL connection
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

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: 'API route not found',
  })
})

// Start server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`PasalOS API running at http://localhost:${PORT}`)
})