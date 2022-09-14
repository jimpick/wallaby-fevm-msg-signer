wallaby-fevm-msg-signer
===

A minimalist command line tool for interacting with the Wallaby testnet
to create Filecoin actors from EVM binaries, and to invoke methods.

Eventually, it will be possible to upload EVM binaries to Filecoin using
standard Ethereum JSON-RPC clients. Until that time, here is a custom
tool that speaks to the hosted GLIF endpoint using Lotus JSON-RPC calls.

# Video Demo

* Twitch: [Deploying your first simple Solidity smart contract on the Filecoin Ethereum Virtual Machine (FEVM)](https://www.twitch.tv/videos/1590881625)

# Install

First, make sure you have a recent install of [Node.js](https://nodejs.org/en/) on your system.

Then install it globally from NPM:

`npm install -g @jimpick/wallaby-fevm-msg-signer`

# Usage

```
Usage: wallaby-fevm-msg-signer <command>

Commands:

  create-evm-actor <bytecode file>
  invoke-evm-actor <actor id> <method signature> <optional params (hex)>

Options:

  --seed-phrase=<phrase>
  --account-number=<integer>
  --endpoint=<url>
  --evm-actor-cid=<cid> (for create-evm-actor)
  --milestone=<codename> (for create-evm-actor)

Environment Variables: (can be set using .env file)

  SEED_PHRASE    ACCOUNT_NUMBER  ENDPOINT
  EVM_ACTOR_CID  MILESTONE
```

The command line is designed to mimic `lotus chain create-evm-actor`
and `lotus chain invoke-evm-actor`. You can use this tool and the
public GLIF API gateway for the Wallaby testnet instead of having
to install a Lotus node on the testnet yourself.

# Quickstart

## Compile a contract

Make sure you have the Solidity compiler installed
([instructions](https://docs.soliditylang.org/en/v0.8.9/installing-solidity.html)).

Make an empty directory for your files.

Let's start with the "Storage Example" (from the [Solidity docs](https://docs.soliditylang.org/en/v0.8.16/introduction-to-smart-contracts.html)):

SimpleStorage.sol:

```
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract SimpleStorage {
    uint storedData;

    function set(uint x) public {
        storedData = x;
    }

    function get() public view returns (uint) {
        return storedData;
    }
}
```

Compile it:

```
$ solc --bin --hashes SimpleStorage.sol -o output
Compiler run successful. Artifact(s) can be found in directory "output".
$ ls output/
SimpleStorage.bin		SimpleStorage.signatures
```

## Set up your wallet

Go to the GLIF Wallet at https://wallet.glif.io/?network=wallaby

Under "Burner Wallets", click "Create Seed Phrase", and copy it or
save it somewhere.

Here's an example:

```
flush flight sponsor captain thumb strategy tuna relax conduct theme involve jacket grass labor puzzle unaware recycle trouble enable bubble blanket escape license ticket
```

(don't use this one, create your own)

Download it or copy it into a file called `dontlookhere.txt` in your directory.

The seed phrase can be passed to the tool as an option (eg. --seedphrase="flush flight...")
or set in the SEED_PHRASE environment variable.

For convenience, we will create a `.env` file with the following contents:

```
SEED_PHRASE=@dontlookhere.txt
```

The special "@" prefix tells the tool to read the contents of the seed phrase from
the file named "dontlookhere.txt".

With a single seed phrase, there are multiple accounts/addresses that you can
use, starting from "Account 0". You can use the --account-number=<number> option
with the tool to use accounts other than the first one.

While you are in the GLIF Wallet, also record the address for "Account 0". Initially
it will have no funds, so you will need to fund it from the Wallaby Faucet.

For our example, the address looks like: `t1maw6wyyzizomhry25uwvlv7z6bali7ihkseznhi`

## Get funds from the Faucet

Go to the Wallet Faucet here: https://wallaby.network/#faucet (scroll down)

Enter in your address and complete the Captcha, and wait for the funds to be
deposited.

It's a good idea to save the message ID so you can track it.

eg. `bafy2bzacedooqx3lkogqeg5cfeodo37ub3p36ejmuqn5z7tot7z75ikcnda3w`

You can use the GLIF Explorer to check your balance: https://explorer.glif.io/?network=wallaby

You can view your address on the Explorer to see it's current balance and
historical transcations. You can also view the message from the faucet as well.

## Create a Filecoin Actor

Once you are funded, and your seed phrase is set (either in an environment
variable or in the .env file), you can create your actor:

```
$ wallaby-fevm-msg-signer create-evm-actor output/SimpleStorage.bin 
Warning: Milestone not selected and EVM Actor CID not specified, defaulting to EVM Actor CID for "selenium" release.
         Actor install may fail if wallaby testnet has been updated.
From Address: t1maw6wyyzizomhry25uwvlv7z6bali7ihkseznhi
EVM Actor CID: bafk2bzacecexlftjkmtigpxl4ecsfyj45aifczzyzwafld26r73xibk6upfeq
✔ Sending message to GLIF gateway
Message CID: bafy2bzacedesuudxjiejmbaodcgwz4apecvpdj4dm44fykhnxh3nfn6vmgapc
GLIF Explorer: https://explorer-calibration.glif.link/message/?network=wallaby&cid=bafy2bzacedesuudxjiejmbaodcgwz4apecvpdj4dm44fykhnxh3nfn6vmgapc
✔ Waiting for message to appear on chain................
Message Executed at Height: 7498
Gas Used: 10534252
ID Address: t01082
Robust Address: t2tciiwqwkohc3ifsmfadxcqmtb5vdzaeavb7bngq
```

The code is now installed into the Wallaby testnet and has an actor
address of `t01082`.

Every time this is run, a new actor will be created with a new address.

Note the warning... in order to create an actor using the Lotus API, the tool 
needs to know the Code CID for the embedded system EVM that is compiled to WASM.
This will change with each reset of the Wallaby testnet. Right now, the
CID is hard-coded into the tool for the "selenium" release, but it will
change when the testnet is reset for the next release. At that time, it
will be necessary to update the tool.

## Invoke a method

We'll need the method signatures:

```
$ cat output/SimpleStorage.signatures
Function signatures:
6d4ce63c: get()
60fe47b1: set(uint256)
```

Let's call the `set(uint256)` method:

```
$ wallaby-fevm-msg-signer invoke-evm-actor t01082 60fe47b1 000000000000000000000000000000000000000000000000000000000000abcd
From Address: t14o4avztgsf7b6uet3wz3xigpigvbjqsj6hb75ri
✔ Sending message to GLIF gateway
Message CID: bafy2bzacecpd6rmnzbages5kfnyyfpap44i5y6ttgj47gch32kysh4hen25wu
GLIF Explorer: https://explorer-calibration.glif.link/message/?network=wallaby&cid=bafy2bzacecpd6rmnzbages5kfnyyfpap44i5y6ttgj47gch32kysh4hen25wu
✔ Waiting for message to appear on chain................
Message Executed at Height: 7526
Gas Used: 2771200
No value returned.
```

We passed in the actor ID (`t01082`), the method signature hash (`60fe47b1`) and
the parameter for the set() method (the value we want to store).

Now let's call the `get()` method:

```
$ wallaby-fevm-msg-signer invoke-evm-actor t01082 6d4ce63c
From Address: t1maw6wyyzizomhry25uwvlv7z6bali7ihkseznhi
✔ Sending message to GLIF gateway
Message CID: bafy2bzacedb5noaw5rx5jur4ie65gdfappy37zmqfyl4jscwc26xgmccfzipk
GLIF Explorer: https://explorer-calibration.glif.link/message/?network=wallaby&cid=bafy2bzacedb5noaw5rx5jur4ie65gdfappy37zmqfyl4jscwc26xgmccfzipk
✔ Waiting for message to appear on chain.............
Message Executed at Height: 7532
Gas Used: 2682999
Decoded Result (hex): 000000000000000000000000000000000000000000000000000000000000abcd
```

It worked! The value we stored is the value that was returned!

# Useful Links for Wallaby

* Faucet: https://wallaby.network/#faucet
* GLIF Explorer: https://explorer.glif.io/?network=wallaby
* GLIF Wallet: https://wallet.glif.io/?network=wallaby
* GLIF Safe: https://safe.glif.io/?network=wallaby
* GLIF Public API Gateway: https://wallaby.node.glif.io/
* Filscan: http://wallaby.filscan.io/
* Factor8 Testnet Docs: https://kb.factor8.io/en/docs/fil/wallabynet
* Selenium Verification Test: https://github.com/filecoin-project/testnet-wallaby/issues/4

# License

MIT/Apache-2
