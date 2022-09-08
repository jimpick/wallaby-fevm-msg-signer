import fs from 'fs'
import { CID } from 'multiformats'
import cbor from 'borc'
import filecoinAddress from '@glif/filecoin-address'
import { pushAndWait } from './push-and-wait.mjs'

export async function createActor ({
  argv,
  key,
  endpoint,
  token,
  signerClient
}) {
  const file = argv._[1]
  if (!file) {
    console.error('create-evm-actor: Need bytecode file as a parameter!\n')
    console.error('Usage:\n')
    console.error(
      `  * ${process.argv
        .slice(0, 2)
        .join(' ')} create-evm-actor <bytecode file>`
    )
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
        'Milestone not selected and EVM Actor CID not specified, ' +
          'defaulting to EVM Actor CID for "selenium" release.'
      )
      milestone = 'selenium'
    }

    // For selenium
    if (milestone === 'selenium') {
      evmActorCid =
        'bafk2bzacecexlftjkmtigpxl4ecsfyj45aifczzyzwafld26r73xibk6upfeq'
    }

    if (!evmActorCid) {
      console.error('create-evm-actor: Need CID for EVM actor!\n')
      console.error('Either use --milestone=<release> (eg. "selenium") or')
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
    const evmBytesCbor = cbor.encode([evmBytes, new Uint8Array(0)])

    // Needs a zero byte in front
    const evmActorCidBytes = new Uint8Array(actorCid.bytes.length + 1)
    evmActorCidBytes.set(actorCid.bytes, 1)
    const params = cbor.encode([
      new cbor.Tagged(42, evmActorCidBytes),
      evmBytesCbor
    ])

    console.log('From Address:', key.address)
    console.log('EVM Actor CID:', actorCid.toString())

    console.log('Sending message to GLIF gateway...')
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
    console.log('ID Address:', idAddress.toString())
    const robustAddress = filecoinAddress.newAddress(
      decoded[1][0],
      decoded[1].slice(1),
      't'
    )
    console.log('Robust Address:', robustAddress.toString())
  } catch (e) {
    console.error('create-evm-actor error:', e)
    process.exit(1)
  }
}
