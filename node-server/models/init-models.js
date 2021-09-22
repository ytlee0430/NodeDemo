const { DataTypes } = require('sequelize')
const Users = require('./users')

function initModels(sequelize) {
  const users = Users(sequelize, DataTypes)

  return {
    users
  }
}
module.exports = initModels
module.exports.initModels = initModels
module.exports.default = initModels
