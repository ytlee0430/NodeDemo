const Express = require('express')

const app = Express()

const Sequelize = require('sequelize')
const UsersModel = require('./models/users')
const config = require('./config/config')
const auth = require('./middleware/auth')

const sequelize = new Sequelize(config.db.db_name, config.db.user_name, config.db.pwd, {
  host: config.db.host,
  dialect: config.db.dialect,
  port: config.db.port
})

const users = UsersModel(sequelize, Sequelize.DataTypes)

app.get('/users', auth, (req, res) => {
  users.findAll().then((allUsers) => {
    const allUsersData = allUsers.map((u) => {
      return u.dataValues
    })
    return res.send({ users_data: allUsersData })
  })
})

app.get('/users/:fullname/fullname', auth, (req, res) => {
  users.findAll({ where: { fullname: req.params.fullname } }).then((allUsers) => {
    const allUsersData = allUsers.map((u) => {
      return u.dataValues
    })
    return res.send({ users_data: allUsersData })
  })
})

app.listen(5000, () => { return console.log('Server up on port 5000') })
