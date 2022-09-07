import fs from 'fs'
import { FilecoinClient, FilecoinSigner } from '@blitslabs/filecoin-js-signer'
import { CID } from 'multiformats'
import cbor from 'borc'
import * as dotenv from 'dotenv'
import minimist from 'minimist'

dotenv.config()
const argv = minimist(process.argv.slice(2))

const signer = new FilecoinSigner()

async function run() {
  // Find seed phrase

  let seedPhrase = process.env.SEED_PHRASE || ''
  if (argv['seed-phrase']) {
    seedPhrase = argv['seed-phrase']
  }
  if (seedPhrase.startsWith('@')) {
    seedPhrase = fs.readFileSync(seedPhrase.slice(1), 'utf8')
  }
  seedPhrase = seedPhrase.trim()

  if (seedPhrase.length === 0) {
    console.error('No seed phrase found. Use --seed-phrase="<phrase>" or --seed-phrase="@file"')
    console.error('  or set SEED_PHRASE in the environment or .env file.')
    process.exit(1)
  }

  // Account number

  let accountNumber = process.env.ACCOUNT_NUMBER || '0'
  if (argv['account-number']) {
    accountNumber = argv['account-number']
  }
  accountNumber = parseInt(accountNumber, 10)

  // Load key

  const network = 'testnet'
  const key = await signer.wallet.keyDerive(seedPhrase, `m/44'/1'/0'/0/${accountNumber}`, network)

  // Endpoint

  let endpoint = process.env.ENDPOINT || 'https://wallaby.node.glif.io'
  if (argv['endpoint']) {
    seedPhrase = argv['endpoint']
  }

  // Client

  const token = ''
  const signerClient = new FilecoinClient(endpoint, token)

  // Commands

  if (argv._[0] === 'create-evm-actor') {
    const file = argv._[1]
    if (!file) {
      console.error('create-evm-actor: Need bytecode file as a parameter!\n')
      console.error('Usage:\n')
      console.error(`  * ${process.argv.slice(0, 2).join(' ')} create-evm-actor <bytecode file>`)
      process.exit(1)
    }
    try {
      let evmActorCid = process.env.EVM_ACTOR_CID

      if (argv['evm-actor-cid']) { 
        evmActorCid = argv['evm-actor-cid']
      }

      let milestone = process.env.MILESTONE
      if (!evmActorCid && !milestone) {
        console.error('Milestone not selected and EVM Actor CID not specified, ' +
          'defaulting to EVM Actor CID for "selenium" release.')
        milestone = 'selenium'
      }

      // For selenium
      if (milestone === 'selenium') { 
        evmActorCid = 'bafk2bzacecexlftjkmtigpxl4ecsfyj45aifczzyzwafld26r73xibk6upfeq'
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

      const evmBytes = fs.readFileSync(file)
      console.log('evmBytes', evmBytes)
      const evmBytesCbor = cbor.encode([evmBytes, new Uint8Array(0)])

      // Needs a zero byte in front
      const evmActorCidBytes = new Uint8Array(actorCid.bytes.length + 1)
      evmActorCidBytes.set(actorCid.bytes, 1)
      const params = cbor.encode([new cbor.Tagged(42, evmActorCidBytes), evmBytesCbor])

      console.log('From Address:', key.address)
      console.log('EVM Actor CID:', actorCid.toString())

      // Sending create actor message...
      const message = {
        To: 't01',
        From: key.address,
        Value: "0",
        Method: 2,
        Params: params.toString('base64')
      }

      console.log('message', message)
      const response = await signerClient.tx.sendMessage(
       message,
       key.privateKey,
       true, // updateMsgNonce
       false  // waitMsg
      )
      console.log('Response', response)

    } catch (e) {
      console.error('create-evm-actor error:', e)
      process.exit(1)
    }
  } else if (argv._[0] === 'invoke-evm-actor') {
    console.log(argv._[0])
  } else {
    console.error('Usage:\n')
    console.error(`  * ${process.argv.slice(0, 2).join(' ')} create-evm-actor <bytecode file>`)
    console.error(`  * ${process.argv.slice(0, 2).join(' ')} invoke-evm-actor <actor id> <method signature> <params (hex)>\n`)
    process.exit(1)
  }

  /*
  const response = await filecoin_client.tx.sendMessage(
      message,
      privateKey,
      updateMsgNonce,
      waitMsg
  )
  console.log(response)
  */
}

run()

