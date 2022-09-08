import cbor from 'borc'
import { pushAndWait } from './push-and-wait.mjs'

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
    // console.log('Message:', message)

    const response = await pushAndWait({
      message,
      key,
      endpoint,
      token,
      signerClient
    })
    const base64Result = response.Receipt.Return
    const decoded = Buffer.from(base64Result, 'base64')
    console.log('Decoded Result (hex):', decoded.toString('hex'))
  } catch (e) {
    console.error('invoke-evm-actor error:', e)
    process.exit(1)
  }
}
