const name = 'wallaby-fevm-msg-signer'

function usage () {
  console.error(`Usage: ${name} <command>\n`)
  console.error('Commands:\n')
  console.error(`  create-evm-actor <bytecode file>`)
  console.error(
    `  invoke-evm-actor <actor id> <method signature> ` +
      `<optional params (hex)>`
  )
  console.error('\nOptions:\n')
  console.error(`  --seed-phrase=<phrase>`)
  console.error(`  --account-number=<integer>`)
  console.error(`  --endpoint=<url>`)
  console.error(`  --evm-actor-cid=<cid> (for create-evm-actor)`)
  console.error(`  --milestone=<codename> (for create-evm-actor)`)
  console.error('\nEnvironment Variables: (can be set using .env file)\n')
  console.error(`  SEED_PHRASE    ACCOUNT_NUMBER  ENDPOINT`)
  console.error(`  EVM_ACTOR_CID  MILESTONE`)
}

function usageCreateEvmActor () {
  console.error(`Usage:\n`)
  console.error(`${name} create-evm-actor <bytecode file>`)
}

function usageInvokeEvmActor () {
  console.error(`Usage:\n`)
  console.error(
    `${name} invoke-evm-actor <actor id> <method signature> ` +
      `<optional params (hex)>`
  )
}

module.exports = {
  usage,
  usageCreateEvmActor,
  usageInvokeEvmActor
}
