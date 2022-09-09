const cbor = require('borc')
const pushAndWait = require('./push-and-wait.js')
const { usageInvokeEvmActor } = require('./usage.js')

async function invokeMethod ({ argv, key, endpoint, token, signerClient }) {
  const chalk = (await import('chalk')).default
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
    usageInvokeEvmActor()
    process.exit(1)
  }

  try {
    console.log(chalk.blue('From Address:'), key.address)

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
    if (response.Receipt.Return) {
      const base64Result = response.Receipt.Return
      const decoded = Buffer.from(base64Result, 'base64')
      console.log(chalk.green('Decoded Result (hex):'), decoded.toString('hex'))
    } else {
      console.log(chalk.green('No value returned.'))
    }
  } catch (e) {
    console.error('invoke-evm-actor error:', e)
    process.exit(1)
  }
}

module.exports = invokeMethod
