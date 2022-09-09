const delay = require('delay')
const { HttpJsonRpcConnector, LotusClient } = require('filecoin.js')

async function pushAndWait ({ message, key, endpoint, token, signerClient }) {
  const chalk = (await import('chalk')).default
  const ora = (await import('ora')).default
  const spinner1 = ora('Sending message to GLIF gateway').start()

  const response = await signerClient.tx.sendMessage(
    message,
    key.privateKey,
    true, // updateMsgNonce
    false // waitMsg
  )
  spinner1.succeed()
  const messageCid = response['/']
  console.log(chalk.green('Message CID:'), messageCid)
  console.log(
    chalk.yellow('GLIF Explorer:'),
    `https://explorer-calibration.glif.link/message/?network=wallaby&cid=${messageCid}`
  )

  // Wait for message using Filecoin.js
  const connector = new HttpJsonRpcConnector({ url: endpoint, token })
  const waitClient = new LotusClient(connector)

  const spinner2 = ora('Waiting for message to appear on chain').start()
  let waitResponse
  while (true) {
    try {
      spinner2.text += '.'
      // console.log('API call')
      waitResponse = await waitClient.state.searchMsg({ '/': messageCid })
      if (!waitResponse) {
        // console.log('Sleeping 5s')
        await delay(5000)
        continue
      }
      spinner2.succeed()
      break
    } catch (e) {
      if (e.message.match(/timeout/i)) continue
      spinner2.fail()
      console.error('Error', e)
      break
    }
  }
  if (waitResponse.Receipt.ExitCode !== 0) {
    console.log('Response:', waitResponse)
    process.exit(1)
  }
  // console.log('Response:', waitResponse)
  console.log('Message Executed at Height:', waitResponse.Height)
  console.log('Gas Used:', waitResponse.Receipt.GasUsed)
  // console.log('Base64 Result:', base64Result)
  return waitResponse
}

module.exports = pushAndWait
