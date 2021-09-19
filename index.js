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
    if (allUsers.length == 0) {
      res.status(404).send('users resource not found')
    }

    const allUsersData = allUsers.map((u) => {
      return u.dataValues.acct
    })

    return res.send({ users: allUsersData })
  })
})

// is find 'an' user by fullname, what if fullnames are duplicated in db?
app.get('/users/:fullname/fullname', auth, (req, res) => {
  users.findOne({ where: { fullname: req.params.fullname } }).then((user) => {
    if (!user) {
      res.status(404).send('fullname not found')
    }
    return res.send({ user: user.acct })
  })
})

app.listen(5000, () => { return console.log('Server up on port 5000') })
