const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')

const config = require('../config/config')
const UsersModel = require('../models/users')
const sendMessageSocket = require('../web-socket/send-message-socket')

const sequelize = new Sequelize(config.db.db_name, config.db.user_name, config.db.pwd, {
  host: config.db.host,
  dialect: config.db.dialect,
  port: config.db.port,
  timezone: config.db.timezone
})

const users = UsersModel(sequelize, Sequelize.DataTypes)

function setGetUsersQueryDefault(query) {
  if (!parseInt(query.limit, 10)) {
    query.limit = 1000
  }
  if (!parseInt(query.offset, 10)) {
    query.offset = 0
  }
  query.order_colunm = query.order_colunm || 'acct'
  query.order = query.order || 'ASC'
}

exports.getUsers = (req, res) => {
  setGetUsersQueryDefault(req.query)
  users.findAll({
    limit: req.query.limit,
    offset: req.query.offset,
    order: [[req.query.order_colunm, req.query.order]]
  }).then((allUsers) => {
    if (allUsers.length === 0) {
      return res.status(404).send({ message: 'users resource not found' })
    }

    const allUsersData = allUsers.map((u) => {
      return u.dataValues.acct
    })

    return res.send({ users: allUsersData })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
}

exports.getUserByFullname = (req, res) => {
  users.findOne({ where: { fullname: req.params.fullname } }).then((user) => {
    if (!user) {
      res.status(404).send({ message: 'fullname not found' })
    }
    return res.send({ user: user.acct })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
}

exports.getUserByAccount = (req, res) => {
  users.findByPk(req.params.account).then((user) => {
    if (!user) {
      res.status(404).send({ message: 'user not found' })
    }
    return res.send({ user })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
}

exports.createUser = (req, res) => {
  users.create({
    acct: req.body.account,
    pwd: req.body.pwd,
    fullname: req.body.fullname,
    created_at: new Date().toUTCString(),
    updated_at: new Date().toUTCString()
  }).then((user) => {
    const token = jwt.sign(user.toJSON(), config.secret, { expiresIn: '60m' })
    return res.status(201).send({ user, token })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
}

exports.authenticateByPassword = (req, res) => {
  users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
    if (user == null) {
      sendMessageSocket.send(req.body.account)
      return res.status(401).send({ message: 'authenticate fail' })
    }
    const token = jwt.sign(user.toJSON(), config.secret, { expiresIn: '60m' })
    return res.status(201).send({ user, token })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
}

exports.deleteUser = (req, res) => {
  users.findOne({ where: { acct: req.body.account } }).then((user) => {
    if (user == null) {
      return res.status(404).send({ message: 'account not found' })
    }
    if (user.pwd !== req.body.pwd) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    users.destroy({ where: { acct: user.acct } })
    return res.status(204).send()
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
}

function updateUserData(user, requestBody, updatePassword = false) {
  if (requestBody.fullname != null) {
    user.fullname = requestBody.fullname
  }
  if (updatePassword && requestBody.new_password != null) {
    user.pwd = requestBody.new_password
  }
  user.updated_at = new Date().toUTCString()
}

exports.updateUser = (req, res) => {
  users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
    if (user == null) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    updateUserData(user, req.body, true)
    user.save()
    return res.status(200).send({ user })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
}

exports.updateUserFullname = (req, res) => {
  users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
    if (user == null) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    updateUserData(user, req.body)
    user.save()
    return res.status(200).send({ user })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
}
