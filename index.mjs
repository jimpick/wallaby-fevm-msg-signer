import fs from 'fs'
import { FilecoinClient, FilecoinSigner } from '@blitslabs/filecoin-js-signer'
import * as dotenv from 'dotenv'
import minimist from 'minimist'

dotenv.config()
const argv = minimist(process.argv.slice(2))

const signer = new FilecoinSigner()

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

// Load keys

const network = 'testnet'
const keys = await signer.wallet.keyDerive(seedPhrase, `m/44'/1'/0'/0/${accountNumber}`, network)
// console.log(keys)

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
    const evmBytes = fs.readFileSync(file)
    console.log('evmBytes', evmBytes)
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
