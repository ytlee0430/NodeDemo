/* eslint-disable no-param-reassign */
const Express = require('express')

const app = Express()
const Sequelize = require('sequelize')
const url = require('url')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const swaggerUi = require('swagger-ui-express')
const SocketServer = require('ws').Server
const https = require('https')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const csrf = require('csurf')
const swaggerDocument = require('./swagger/swagger.json')
const UsersModel = require('./models/users')
const config = require('./config/config')
const auth = require('./middleware/auth')
const authAccount = require('./middleware/authAccount')

const hskey = fs.readFileSync('keys/server.key', 'utf8')
const hscert = fs.readFileSync('keys/server.crt', 'utf8')
const credentials = {
  key: hskey,
  cert: hscert
}

const webSockets = {}

const sequelize = new Sequelize(config.db.db_name, config.db.user_name, config.db.pwd, {
  host: config.db.host,
  dialect: config.db.dialect,
  port: config.db.port,
  timezone: config.db.timezone
})

const users = UsersModel(sequelize, Sequelize.DataTypes)

app.set('secret', config.secret)
app.use(Express.json())
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  res.status(500).send('Internal Error')
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use(cookieParser())
app.use(
  session({
    secret: '123qwe',
    resave: false,
    saveUninitialized: false
  })
)
app.use(csrf())

app.listen(5000, () => { return console.log('Server up on port 5000') })
https.createServer(credentials, app).listen(5001, () => {
  console.log('Https Server up on port 5001')
})
const server = Express().listen(3000, () => { return console.log('WebSocket Listening on 3000') })
const wss = new SocketServer({ server })

wss.on('connection', (webSocket, req) => {
  const parameters = url.parse(req.url, true)
  const userID = parameters.query.acct
  webSockets[userID] = webSocket
  console.log(`connected: ${userID} in ${Object.getOwnPropertyNames(webSocket)}`)
  webSocket.on('close', () => {
    console.log('Close connected')
  })
})

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

app.get('/xsrf-token', (req, res) => {
  res.send({ csrfToken: req.csrfToken() })
})

app.get('/users', auth, (req, res) => {
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
    return res
  })

app.post('/users/authenticate', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }), (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() })
  }
  users.findOne({ where: { acct: req.body.account, pwd: req.body.pwd } }).then((user) => {
    if (user == null) {
      if (req.body.account in webSockets) {
        webSockets[req.body.account].send('authenticate fail')
      }
      return res.status(401).send({ message: 'authenticate fail' })
    }
    const token = jwt.sign(user.toJSON(), app.get('secret'), { expiresIn: '60m' })
    return res.status(201).send({ user, token })
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
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
    if (user.pwd !== req.body.pwd) {
      return res.status(401).send({ message: 'authenticate fail' })
    }
    users.destroy({ where: { acct: user.acct } })
    return res.status(204).send()
  }).catch((error) => {
    return res.status(400).send({ message: error.toString() })
  })
  return res
})

function updateUserData(user, requestBody, updatePassword = false) {
  if (requestBody.fullname != null) {
    user.fullname = requestBody.fullname
  }
  if (updatePassword && requestBody.new_password != null) {
    user.pwd = requestBody.new_password
  }
  user.updated_at = new Date().toUTCString()
}

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
      updateUserData(user, req.body, true)
      user.save()
      return res.status(200).send({ user })
    }).catch((error) => {
      return res.status(400).send({ message: error.toString() })
    })
    return res
  })

app.put('/users/fullname', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }),
  body('fullname').isLength({ max: 32 }), authAccount, (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: errors.array() })
    }
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
  })
