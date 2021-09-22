const { DataTypes } = require('sequelize')
const _users = require('./users')

function initModels(sequelize) {
  const users = _users(sequelize, DataTypes)

  return {
    users
  }
}
module.exports = initModels
module.exports.initModels = initModels
module.exports.default = initModels
