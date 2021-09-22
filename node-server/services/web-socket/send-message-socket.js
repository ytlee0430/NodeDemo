const SocketServer = require('ws').Server
const url = require('url')

const webSockets = {}

exports.start = (Express) => {
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
}

exports.send = (account) => {
  if (account in webSockets) {
    webSockets[account].send('authenticate fail')
  } else {
    console.log('can not found websocket')
  }
}
