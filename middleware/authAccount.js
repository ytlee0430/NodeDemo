const jwt = require("jsonwebtoken")
const config = require('../config/config')

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token']
  const account = req.body.account || req.params.account
  if (!token) {
    return res.status(403).send('JWT token is required')
  }
  try {
    const decoded = jwt.verify(token, config.secret)
    if (account != decoded.acct) {
      return res.status(403).send('Wrong JWT token')
    }
    req.user = decoded
  } catch (err) {
    return res.status(401).send('Invalid Token')
  }
  return next()
}

module.exports = verifyToken
