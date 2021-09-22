const WebSocket = require('ws')
const readline = require('readline')
const request = require('request')
const strict = require('assert/strict')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function signIn(account, pwd) {
  const options = {
    method: 'POST',
    url: 'http://localhost:5000/users/authenticate',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account,
      pwd
    })
  }
  request(options, (error, response) => {
    console.log(response.body)
    console.log('\n')
  })
}

async function recursive() {
  console.log('here! \n')
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
