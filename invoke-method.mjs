import cbor from 'borc'
import delay from 'delay'
import { HttpJsonRpcConnector, LotusClient } from 'filecoin.js'

export async function invokeMethod ({
  argv,
  key,
  endpoint,
  token,
  signerClient
}) {
  const address = argv._[1]
  if (!address) {
    console.error('invoke-evm-actor: Need actor address as a parameter!\n')
  }

  const method = argv._[2]
  if (!method) {
    console.error('invoke-evm-actor: Need method signature as a parameter!\n')
  }

  const methodParamsHex = argv._[3]

  if (!address || !method) {
    console.error('Usage:\n')
    console.error(
      `  * ${process.argv
        .slice(0, 2)
        .join(
          ' '
        )} invoke-evm-actor <actor id> <method signature> <params (hex)>\n`
    )
    process.exit(1)
  }
  try {
    console.log('From Address:', key.address)
    console.log('Sending message to GLIF gateway...')

    const evmParams = Buffer.concat([
      Buffer.from(String(method), 'hex'),
      Buffer.from(String(methodParamsHex), 'hex')
    ])
    const params = cbor.encode([evmParams])

    // Sending message to invoke method...
    const message = {
      To: address,
      From: key.address,
      Value: '0',
      Method: 2,
      Params: params.toString('base64')
    }
    console.log('Message:', message)

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
    if (waitResponse.Receipt.ExitCode === 0) {
      console.log('Response:', waitResponse)
      console.log('Message Executed at Height:', waitResponse.Height)
      console.log('Gas Used:', waitResponse.Receipt.GasUsed)
      const base64Result = waitResponse.Receipt.Return
      // console.log('Base64 Result:', base64Result)
      const decoded = Buffer.from(base64Result, 'base64')
      console.log('Decoded Result:', decoded)
    } else {
      console.log('Response:', waitResponse)
      process.exit(1)
    }
  } catch (e) {
    console.error('invoke-evm-actor error:', e)
    process.exit(1)
  }
}
