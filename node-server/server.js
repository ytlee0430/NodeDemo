const Express = require('express')
const { body } = require('express-validator')
const auth = require('./middleware/auth')
const authAccount = require('./middleware/auth-account')
const validRequest = require('./middleware/valid-request')
const sendMessageSocket = require('./services/web-socket/send-message-socket')
const appSetup = require('./app-setup')
const userController = require('./controllers/user-controller')

const app = Express()

sendMessageSocket.start(Express)

appSetup.setup(app, Express)

app.get('/xsrf-token', (req, res) => { res.send({ csrfToken: req.csrfToken() }) })

app.get('/users', auth, userController.getUsers)

// is find 'an' user by fullname, what if fullnames are duplicated in db?
app.get('/users/:fullname/fullname', auth, userController.getUserByFullname)

app.get('/users/:account/account', authAccount, userController.getUserByAccount)

app.post('/users', body('account').isLength({ max: 32 }),
  body('pwd').isLength({ max: 32 }), body('fullname').isLength({ max: 32 }), userController.createUser)

app.post('/users/authenticate', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }), validRequest, userController.authenticateByPassword)

app.delete('/users', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }), authAccount, validRequest, userController.deleteUser)

app.put('/users', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }),
  body('fullname').isLength({ max: 32 }), authAccount, validRequest, userController.updateUser)

app.put('/users/fullname', body('account').isLength({ max: 32 }), body('pwd').isLength({ max: 32 }),
  body('fullname').isLength({ max: 32 }), authAccount, userController.updateUserFullname)
