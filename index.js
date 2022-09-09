#!/usr/bin/env node

const fs = require('fs')
const { FilecoinClient, FilecoinSigner } = require('@blitslabs/filecoin-js-signer')
const minimist = require('minimist')
const createActor = require('./create-actor.js')
const invokeMethod = require('./invoke-method.js')
require('dotenv').config()

const argv = minimist(process.argv.slice(2))

async function run () {
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
    console.error(
      'No seed phrase found. Use --seed-phrase="<phrase>" or --seed-phrase="@file"'
    )
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
  const signer = new FilecoinSigner()
  const key = await signer.wallet.keyDerive(
    seedPhrase,
    `m/44'/1'/0'/0/${accountNumber}`,
    network
  )

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
    await createActor({
      argv,
      key,
      endpoint,
      token,
      signerClient
    })
  } else if (argv._[0] === 'invoke-evm-actor') {
    await invokeMethod({
      argv,
      key,
      endpoint,
      token,
      signerClient
    })
  } else {
    console.error('Usage:\n')
    console.error(
      `  * ${process.argv
        .slice(0, 2)
        .join(' ')} create-evm-actor <bytecode file>`
    )
    console.error(
      `  * ${process.argv
        .slice(0, 2)
        .join(
          ' '
        )} invoke-evm-actor <actor id> <method signature> <params (hex)>\n`
    )
    process.exit(1)
  }
}

run()
