const { validationResult } = require('express-validator')

const validRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).send({ message: errors.array() })
  }
  return next()
}

module.exports = validRequest
