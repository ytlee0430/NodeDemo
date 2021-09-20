const Express = require('express')

const app = Express()

const Sequelize = require('sequelize')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const UsersModel = require('./models/users')
const config = require('./config/config')
const auth = require('./middleware/auth')
const authAccount = require('./middleware/authAccount')

const sequelize = new Sequelize(config.db.db_name, config.db.user_name, config.db.pwd, {
  host: config.db.host,
  dialect: config.db.dialect,
  port: config.db.port,
  timezone: config.db.timezone
})

const users = UsersModel(sequelize, Sequelize.DataTypes)

app.set('secret', config.secret)
app.use(Express.json())
app.use((err, req, res, _next) => {
  res.status(500).send('Internal Error')
})

app.get('/users', auth, (req, res) => {
  users.findAll().then((allUsers) => {
    if (allUsers.length == 0) {
      res.status(404).send({ message: 'users resource not found' })
    }

    const allUsersData = allUsers.map((u) => {
      return u.dataValues.acct
    })

    return res.send({ users: allUsersData })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
})

// is find 'an' user by fullname, what if fullnames are duplicated in db?
app.get('/users/:fullname/fullname', auth, (req, res) => {
  users.findOne({ where: { fullname: req.params.fullname } }).then((user) => {
    if (!user) {
      res.status(404).send({ message: 'fullname not found' })
    }
    return res.send({ user: user.acct })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
})

app.get('/users/:account/account', authAccount, (req, res) => {
  users.findByPk(req.params.account).then((user) => {
    if (!user) {
      res.status(404).send({ message: 'user not found' })
    }
    return res.send({ user })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
})

app.post('/users', body('account').isLength({ max: 32 }),
  body('pwd').isLength({ max: 32 }), body('fullname').isLength({ max: 32 }), (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    users.create({
      acct: req.body.account,
      pwd: req.body.pwd,
      fullname: req.body.fullname,
      created_at: new Date().toUTCString(),
      updated_at: new Date().toUTCString()
    }).then((user) => {
      const token = jwt.sign(user.toJSON(), app.get('secret'), { expiresIn: '60m' })
      return res.status(201).send({ user, token })
    }).catch((error) => {
      return res.status(400).send({ message: error.toString() })
    })
  })

app.post('/users/authenticate', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }), (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }
  users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
    if (user == null) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    const token = jwt.sign(user.toJSON(), app.get('secret'), { expiresIn: '60m' })
    return res.status(201).send({ user, token })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
})

app.delete('/users', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }), authAccount, (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }
  users.findOne({ where: { acct: req.body.account } }).then((user) => {
    if (user == null) {
      return res.status(404).send({ message: 'account not found' })
    }
    if (user.pwd != req.body.pwd) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    users.destroy({ where: { acct: user.acct } })
    return res.status(204).send()
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
})

app.put('/users', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }),
  body('fullname').isLength({ max: 32 }), authAccount, (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: errors.array() })
    }
    users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
      if (user == null) {
        return res.status(401).send({ message: 'authenticate fail' })
      }
      if (req.body.fullname != null) {
        user.fullname = req.body.fullname
      }
      if (req.body.new_password != null) {
        user.pwd = req.body.new_password
      }
      user.updated_at = new Date().toUTCString()
      user.save()
      return res.status(200).send({ user })
    }).catch((error) => {
      return res.status(400).send({ message: error.toString() })
    })
  })

app.listen(5000, () => { return console.log('Server up on port 5000') })
