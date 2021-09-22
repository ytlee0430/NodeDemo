const fs = require('fs')

const hskey = fs.readFileSync('keys/server.key', 'utf8')
const hscert = fs.readFileSync('keys/server.crt', 'utf8')
const credentials = {
  key: hskey,
  cert: hscert
}

const https = require('https')
const swaggerUi = require('swagger-ui-express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const csrf = require('csurf')
const helmet = require('helmet')
const swaggerDocument = require('./swagger/swagger.json')
const config = require('./config/config')

exports.setup = (app, Express) => {
  app.set('secret', config.secret)
  app.use(Express.json())
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
  app.use(helmet())
  app.listen(5000, () => { return console.log('Server up on port 5000') })
  https.createServer(credentials, app).listen(5001, () => {
    console.log('Https Server up on port 5001')
  })
}
