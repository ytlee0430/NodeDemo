const WebSocket = require('ws')
const readline = require('readline')
const request = require('request')
const config = require('./config')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function signIn(account, pwd) {
  const tokenOptions = {
    method: 'GET',
    url: `http://${config.host}:5000/xsrf-token`,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  request(tokenOptions, (tokenError, tokenResponse) => {
    const cookie = tokenResponse.headers['set-cookie']
    const { csrfToken } = JSON.parse(tokenResponse.body)
    const options = {
      method: 'POST',
      url: `http://${config.host}:5000/users/authenticate`,
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': csrfToken,
        cookie
      },
      body: JSON.stringify({
        account,
        pwd
      }),
      credentials: 'include'
    }
    request(options, (error, response) => {
      // console.log(response.body)
      console.log('response back \n')
    })
  })
}

async function recursive() {
  let accountName = ''
  rl.question('What is your account, password? \n', (str) => {
    if (str === 'exit') {
      console.log('close \n')
      rl.close()
      return
    }
    const stringArray = str.split(' ')
    accountName = stringArray[0]
    signIn(stringArray[0], stringArray[1])
    const ws = new WebSocket(`ws://localhost:3000?acct=${accountName}`)

    ws.onmessage = (event) => {
      console.log(event.data)
      console.log('\n')
    }
    recursive()
  })
}

recursive()
