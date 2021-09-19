const jwt = require("jsonwebtoken")
const config = require('../config/config')

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token']

  if (!token) {
    return res.status(403).send('JWT token is required')
  }
  try {
    const decoded = jwt.verify(token, config.secret)
    req.user = decoded
  } catch (err) {
    return res.status(401).send('Invalid Token')
  }
  return next()
}

module.exports = verifyToken;