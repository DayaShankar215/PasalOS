// DEVELOPMENT ONLY.
// Never use this middleware as production authentication.

module.exports = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'Development shop middleware is disabled in production.',
    })
  }

  const shopId = Number(process.env.DEV_SHOP_ID)

  if (!Number.isSafeInteger(shopId) || shopId <= 0) {
    return res.status(500).json({
      success: false,
      message: 'Set a valid DEV_SHOP_ID in your .env file.',
    })
  }

  req.shopId = shopId
  next()
}