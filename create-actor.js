const fs = require('fs')
const { CID } = require('multiformats')
const cbor = require('borc')
const filecoinAddress = require('@glif/filecoin-address')
const pushAndWait = require('./push-and-wait.js')
const { usageCreateEvmActor } = require('./usage.js')

async function createActor ({ argv, key, endpoint, token, signerClient }) {
  const chalk = (await import('chalk')).default
  const file = argv._[1]
  if (!file) {
    usageCreateEvmActor()
    process.exit(1)
  }
  try {
    let evmActorCid = process.env.EVM_ACTOR_CID
    if (argv['evm-actor-cid']) {
      evmActorCid = argv['evm-actor-cid']
    }

    let milestone = process.env.MILESTONE
    if (argv['milestone']) {
      milestone = argv['milestone']
    }

    if (!evmActorCid && !milestone) {
      console.error(
        chalk.red('Warning:') +
          ' Milestone not selected and EVM Actor CID not specified, ' +
          'defaulting to EVM Actor CID for "copper" release.'
      )
      console.error(
        '         Actor install may fail if wallaby testnet has been updated.'
      )
      milestone = 'copper'
    }

    // For copper
    if (milestone === 'copper') {
      evmActorCid =
        'bafk2bzacecexlftjkmtigpxl4ecsfyj45aifczzyzwafld26r73xibk6upfeq'
    }

    if (!evmActorCid) {
      console.error('create-evm-actor: Need CID for EVM actor!\n')
      console.error('Either use --milestone=<release> (eg. "copper") or')
      console.error(' use --evm-actor-cid=<cid>. You can also set the')
      console.error(' MILESTONE or EVM_ACTOR_CID environment variables or')
      console.error(' define them in the .env file.')
      process.exit(1)
    }

    const actorCid = CID.parse(evmActorCid)

    if (!fs.existsSync(file)) {
      console.error('File not found:', file)
      process.exit(1)
    }
    const evmBytes = fs.readFileSync(file)
    let evmBytesConverted = evmBytes
    if (evmBytes[0] != 0x60 && evmBytes[1] != 0x80) {
      evmBytesConverted = Buffer.from(evmBytes.toString().trim(), 'hex')
    }
    const evmBytesCbor = cbor.encode([evmBytesConverted, new Uint8Array(0)])

    // Needs a zero byte in front
    const evmActorCidBytes = new Uint8Array(actorCid.bytes.length + 1)
    evmActorCidBytes.set(actorCid.bytes, 1)
    const params = cbor.encode([
      new cbor.Tagged(42, evmActorCidBytes),
      evmBytesCbor
    ])

    console.log(chalk.blue('From Address:'), key.address)
    console.log(chalk.blue('EVM Actor CID:'), actorCid.toString())

    // Sending create actor message...
    const message = {
      To: 't01',
      From: key.address,
      Value: '0',
      Method: 2,
      Params: params.toString('base64')
    }

    const response = await pushAndWait({
      message,
      key,
      endpoint,
      token,
      signerClient
    })
    const base64Result = response.Receipt.Return

    const decoded = cbor.decode(base64Result, 'base64')
    // console.log('CBOR Decoded Result:', decoded)
    const idAddress = filecoinAddress.newAddress(
      decoded[0][0],
      decoded[0].slice(1),
      't'
    )
    console.log(chalk.green('ID Address:'), idAddress.toString())
    const robustAddress = filecoinAddress.newAddress(
      decoded[1][0],
      decoded[1].slice(1),
      't'
    )
    console.log(chalk.green('Robust Address:'), robustAddress.toString())
  } catch (e) {
    console.error('create-evm-actor error:', e)
    process.exit(1)
  }
}

module.exports = createActor
