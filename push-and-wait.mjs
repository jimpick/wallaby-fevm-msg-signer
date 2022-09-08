import delay from 'delay'
import { HttpJsonRpcConnector, LotusClient } from 'filecoin.js'

export async function pushAndWait ({
  message,
  key,
  endpoint,
  token,
  signerClient
}) {
  const response = await signerClient.tx.sendMessage(
    message,
    key.privateKey,
    true, // updateMsgNonce
    false // waitMsg
  )
  const messageCid = response['/']
  console.log('Message CID:', messageCid)
  console.log(
    'GLIF Explorer:',
    `https://explorer-calibration.glif.link/message/?network=wallaby&cid=${messageCid}`
  )

  // Wait for message using Filecoin.js
  const connector = new HttpJsonRpcConnector({ url: endpoint, token })
  const waitClient = new LotusClient(connector)

  console.log('Waiting for message to appear on chain...')
  let waitResponse
  while (true) {
    try {
      process.stdout.write('.')
      // console.log('API call')
      waitResponse = await waitClient.state.searchMsg({ '/': messageCid })
      if (!waitResponse) {
        // console.log('Sleeping 5s')
        await delay(5000)
        continue
      }
      break
    } catch (e) {
      console.error('Error', e)
      if (e.message.match(/timeout/i)) continue
      break
    }
  }
  process.stdout.write('\n')
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
