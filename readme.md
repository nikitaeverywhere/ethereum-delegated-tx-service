# Ethereum Delegated Transactions Universal Back End

[![Actions Status](https://github.com/zitros/ethereum-delegated-tx-service/workflows/Tests/badge.svg)](https://github.com/zitros/ethereum-delegated-tx-service/actions)

Elegant Ethereum delegated transactions implementation.

Primarily, delegated transactions, or meta transactions allow users to pay fees in tokens instead of Ether, making the crypto user experience great again. This back end is shipped with [configurable widget](https://github.com/ZitRos/ethereum-delegated-tx-widget), which can be used for any token or smart contract supporting doing-something-via-signature.

+ Allows users to pay fee in tokens instead of Ether, making crypto UX great again
+ Universal back end **for any Ethereum contract implementation**
+ Signature standard-free (use whatever your contract/token supports)
+ Features the simplest API possible (`/` - `/request` - `/confirm` - `/status`)
+ Ships with [highly-configurable UI](https://zitros.github.io/ethereum-delegated-tx-widget/)

<p align="center">
  <br/><b><a href="https://zitros.github.io/ethereum-delegated-tx-widget/" target="_blank">→ CHECK THE DEMO HERE! ←</a></b><br/><br/>
  <img src="https://user-images.githubusercontent.com/4989256/64173367-cbec8080-ce5f-11e9-87c3-c1c77ae83dc4.png" alt="screenshot" width="360"><br/><br/>
  Need test tokens? Use this widget via <a href="https://zitros.github.io/ethereum-delegated-tx-widget/?contractAddress=0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa" target="_blank">this link</a>
  and
  <a href="https://kovan.etherscan.io/address/0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa#writeContract" target="_blank">mint some test tokens</a> in Kovan network<br/>by calling <code>mintTokens</code> function (mints 10 tokens to a calling account). <br/>Need some Ether in Kovan? <a href="https://www.google.com/search?q=kovan+ether+faucet" target="_blank">Find</a> any faucet that can give you some.
</p>

## Delegated Transactions Concept

- ✔ Any token implementation (which supports delegated transactions, for example, [DREAM](https://etherscan.io/token/0x82f4ded9cec9b5750fbff5c2185aee35afc16587))
- ✔ Any signature standard (supported by wallets)
- ⚠ Only the manifest file is required for each token (see `/config/contracts`)

This back end works for any smart contracts (primarily for token smart contracts) which support delegated transactions. By design, such smart contracts should expose functions which allow running its "original functions" by signature, or, in other words, allowing to **avoid paying fees in Ether**. For instance:

```javascript
//         ↓↓↓↓↓↓↓↓ Original function
erc20Token.transfer(to, value)
//                  ↑↑  ↑↑↑↑↑ Original arguments

//         ↓↓↓↓↓↓↓↓ Delegated function
erc20Token.transferViaSignature(to, value, fee, feeRecipient, deadline, sigId, sig, sigStandard)
//                    Additional arguments ↑↑↑  ↑↑↑↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑  ↑↑↑↑↑  ↑↑↑  ↑↑↑↑↑↑↑↑↑↑↑
```

(more information will be provided soon)

## API

To perform a delegated transaction, the client has to send 2 POST requests (+ 2 optional GET requests to get back end metadata and check the status of the transaction). In general, this back end is designed to support the following full workflow:

0. [The client requests backend metadata to understand which contracts can it handle.](#0-the-client-requests-backend-metadata-to-understand-which-contracts-can-it-handle)
1. [The client requests metadata for a particular function call (in this example, `transfer(...)`).](#1-the-client-requests-metadata-for-a-particular-function-call-in-this-example-transfer)
2. [The user's signature is sent back to confirm delegated request.](#2-the-users-signature-is-sent-back-to-confirm-delegated-request)
3. [Later, the client can poll back end server for any delegated request updates.](#3-later-the-client-can-poll-back-end-server-for-any-delegated-request-updates)

### 0. The client requests backend metadata to understand which contracts can it handle.

```javascript
// >>>>>> GET /

// <<<<<< (response)
{
  "service-name": "ethereum-delegated-transactions",
  "version": "1.0.0",
  "networkChainId": 42,
  "networkName": "kovan",
  "contracts": [ // Auto-generated based on available contract ABI/Manifest files.
    {
      "address": "0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa",
      "implements": [ // ["ERC20", "ERC721"]
        "ERC20"
      ],
      "constants": { // Some properties (like ERC20 constants) are retrieved automatically from ABI/network
        "symbol": "DREAM",
        "decimals": 6
      },
      "functions": [ // Set of function which can be used within this back end
        {
          "name": "transfer",
          "arguments": [
            {
              "name": "to",
              "type": "address"
            },
            {
              "name": "value",
              "type": "uint256"
            }
          ]
        },
        {
          "name": "approveAndCall",
          "arguments": [
            {
              "name": "spender",
              "type": "address"
            },
            {
              "name": "value",
              "type": "uint256"
            },
            {
              "name": "extraData",
              "type": "bytes"
            }
          ]
        }
      ]
    }
  ]
}
```

### 1. The client requests metadata for a particular function call (in this example, `transfer(...)`).

```javascript
// >>>>>> POST /request
{
  "contractAddress": "0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa",
  "from": "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A",
  "functionName": "transfer",
  "functionArguments": ["0xeee835EaaD87175E20aC048F9E5592CFbEf9161D", "6000000"]
}

// <<<<<< (response)
{
  "request": {
    "id": "fbf098f2-e676-4b6c-9b73-f24fe1da2b9d",
    "expiresAt": "2019-09-03T14:19:37.482Z",
    "fees": [ // Fees that user has to pay
      {
        "address": "0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa",
        "implements": [
          "ERC20"
        ],
        "symbol": "DREAM",
        "decimals": 6,
        "value": "901918"
      }
    ],
    "signatureOptions": [
      {
        "standard": "eth_personalSign",
        "dataToSign": "0x969c3d0b7c873b882c358154949c5a9b52510b4360408bb986e80f0e57a0640e"
      },
      {
        "standard": "eth_signTypedData",
        "dataToSign": [
          {
            "type": "address",
            "name": "Token Contract Address",
            "value": "0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa"
          },
          {
            "type": "address",
            "name": "Sender's Address",
            "value": "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A"
          },
          {
            "type": "address",
            "name": "Recipient's Address",
            "value": "0xeee835EaaD87175E20aC048F9E5592CFbEf9161D"
          },
          {
            "type": "uint256",
            "name": "Amount to Transfer (last six digits are decimals)",
            "value": "6000000"
          },
          {
            "type": "uint256",
            "name": "Fee in Tokens Paid to Executor (last six digits are decimals)",
            "value": "901918"
          },
          {
            "type": "address",
            "name": "Account which Receives Fee",
            "value": "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A"
          },
          {
            "type": "uint256",
            "name": "Signature Expiration Timestamp (unix timestamp)",
            "value": "1567604977"
          },
          {
            "type": "uint256",
            "name": "Signature ID",
            "value": "0x024acc7b1c8feb265b0b43ca2357238716ad087824448420d33b05bfdf5f2328"
          }
        ]
      }
    ]
  }
}
```

### 2. The user's signature is sent back to confirm delegated request.

```javascript
// >>>>>> POST /confirm
{
  "requestId": "fbf098f2-e676-4b6c-9b73-f24fe1da2b9d", // ID obtained at the previous step
  "signatureStandard": "eth_signTypedData", // Chosen signature standard
  "signature": "0xf5c9fdee84b84787b3cc8beb654f237f3b554d8a20c47cf5e24edb630f047f77618dca1fd134a59ed5ac020fb36ff909a778b152cc9b3c85e044a572e96329401c"
}

// <<<<<< (response)
{
  "id": "fbf098f2-e676-4b6c-9b73-f24fe1da2b9d",
  "expiresAt": "2019-09-04T14:19:37.482Z"
  "status": "confirmed" // new | confirmed | mining | mined | failed
}
```

### 3. Later, the client can poll back end server for any delegated request updates.

```javascript
// >>>>>> GET /status/fbf098f2-e676-4b6c-9b73-f24fe1da2b9d

// <<<<<< (response)
{
  "id": "fbf098f2-e676-4b6c-9b73-f24fe1da2b9d",
  "expiresAt": "2019-09-04T14:19:37.482Z",
  "status": "mining",
  "transactionHash": "0x86446fcecd73b96cbc1df17c5a7abf18aa228f276338794fbb565925d06bfba6", // Use as info field only (there is a potential upcoming upgrade to re-publish transactions once gas price increases, hence, transaction hash can change)
  "reason": "When status is failed, a reason will be provided"
}
```

## Development & Testing

You can optionally use [Docker container](https://www.docker.com) with Docker Compose to launch
a thing (it ships with MongoDB). But it also works if you just run it with NodeJS 10+
(make sure to set `MONGODB_URL` env variable in this case).

Then, run the following:

```bash
bash docker-compose.sh # *nix
# Wait for the container to start. It will bring you to an API container. Then run:
npm run start
# Make sure to also place the plain private key in /config/delegate/any-file-name or provide DELEGATE_PK environment variable
```

Or, without a container:

```bash
export MONGODB_URL=mongodb://127.0.0.1:27017
npm run start
```

Then open `http://localhost:8088`. To run UI locally, check
[UI's repository](https://github.com/ZitRos/ethereum-delegated-tx-widget).

You can play with [DREAM Token in Kovan network](https://kovan.etherscan.io/token/0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa#writeContract)
(`0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa`) to understand how delegated back end works.
To mint DREAM Token, call its `mintTokens` function. Then, `sender` will get 10 DREAM tokens.
Later, you will be able to transfer these tokens using
[delegated transactions service](https://zitros.github.io/ethereum-delegated-tx-widget/).

## Setup

You can easily run your own delegated transactions back end **to support your own token**.
Read through the concept above and perform the steps below to plug in your token to this
delegated back end. Don't forget to make a [pull request](https://github.com/ZitRos/ethereum-delegated-tx-service/pulls)
with your token manifest file!

### 1. Clone & decide how you'll run this back end

```bash
git clone https://github.com/ZitRos/ethereum-delegated-tx-service.git
cd ethereum-delegated-tx-service
```

- You can run the application without container. Just `npm install` and you're ready with `npm start` (note env variables below).
- Use `Dockerfile` to build a container. The container exposes port `8088` by default. Note env variables below which you have to pass there.
- For development purposes, just run `./docker-compose.sh`.

### 2. Configure delegated transactions back end

Use the next environment variables to configure a thing (all optional with defaults specified below):

```bash
ALLOWED_ORIGINS= # Comma-separated list of origins or empty for * (Access-Control-Allow-Origin header)
API_PORT=8088
DELEGATE_PK= # Delegated account private key, as an alternative to putting a file under `/config/delegate`
MONGODB_URL=mongodb://mongo:27017
MONGODB_DB_NAME=ethereum-delegated-tx-$NETWORK_NAME
NETWORK_NAME=kovan
RPC_PROVIDERS=https://kovan.infura.io/v3/ABC,https://kovan.infura.io/v3/DEF # Comma-separated list of RPC providers
ETHERSCAN_API_KEY= # Optional Etherscan API key as a fallback provider
```

Then, put contract ABI and write a manifest file for each of your contract by example. You should have 2 files for each of your contracts:

- `config/contracts/$NETWORK_NAME/$CONTRACT_ADDRESS/abi.json`.
- `config/contracts/$NETWORK_NAME/$CONTRACT_ADDRESS/manifest.js`.

### 3. Prepare your smart contract manifest file (or copy/modify an existing one)

Your token and its delegated transactions implementation might be slightly different or completely
different from [DREAM Token](https://etherscan.io/token/0x82f4ded9cec9b5750fbff5c2185aee35afc16587)
provided as an example - no worries! Below are instructions of how you should write a `manifest.js`
file to support your contract/token. Unfortunately, you have to tackle some JavaScript, as manifest
is a dynamic thing (due to exchange integration, custom logic, etc).

- Manifest file has to provide 2 exports:
   - `export const maxPendingTransactionsPerAccount = ...` - a number of concurrent transactions allowed per account
   - `export const delegatedFunctions = [...]` - description of functions that can be delegated
- `delegatedFunctions` export should export an array of objects with the next properties:
   - `functionName` - a name of **original** function. E.g. `transfer`
   - `delegatedFunctionName` - a name of **delegated** function. E.g. `transferViaSignature`
   - `delegatedFunctionArguments` - a function which generates arguments for delegated function transaction (upon `/confirm`).
   - `requestContext` - an object or a function returning an object with properties, which are added to a request context prior saving the request (see context section below).
   - `requestHandler` - a function which generates a response. Must export `fee` and `signatureOptions` by example.
- `defaultContext` function, which you may find in example is a helper function to gather all required data into context.
- Please, use `context.utils` for everything related to the outer world. Check [src/modules/context.js](src/modules/context.js) file for functions you may use there.
- Once done and tested, *you can submit a PR to this repository with your manifest file or create an issue if something goes wrong*

### 4. Deal with `context` in the manifest file (if you haven't dealt with it yet)

**Context** is an object (a set of properties) which stays within a delegated request from its creation till execution. Once the user performs `/request`, this base context is generated:

```javascript
{
  contract: {
    address: "0x...", // Set from postRequestBody.contractAddress which is required
    decimals: 18 // Auto-determined from contract's ABI
  },
  functionName: "transfer", // Set from postRequestBody.functionName which is required
  functionArguments: [], // Set from postRequestBody.functionArguments, can be an empty array
  from: "0x...", // Set from postRequestBody.from which is required
  gasPriceWei: 9000000000, // Auto-determined from the current network state
  ethToUsd: 199.99, // ETH/USD price
  gasLimit: 90000 // Set from postRequestBody.gasLimit (if provided), can be an empty array
  // + any other properties deserialized from POST request (!!!).
  // However, the above properties overwrite any other properties if specified, so you are safe to use them.
}
```

The `delegatedFunctions[...].requestContext` (async) function you specify in contract manifest
**can add new properties to a manifest file**, usually generating them on-the-fly. For example,
you can calculate the fee based on a current network gas price, ETH price, or the price of your
token. Check available examples to understand how can you write such a function.

### 5. Input your delegate private key

Delegate is an Ethereum account which actually publishes transactions on behalf of other accounts,
**paying fees in Ether**, while collecting **fees in tokens** from these accounts. Hence, a delegate
account should have some Ether balance in the network you're interacting with.

By default, your back end will start with existing "public" delegate account `0xeee835eaad87175e20ac048f9e5592cfbef9161d`.
Its private key is hard-coded and is used if you don't provide another private key. But please,
**do not use it for production or even for testing**!

You have 2 options of how to provide your very own private key to the container/back end:

1. Set `DELEGATE_PK=2CCA...C1FA` environment variable.
2. Put a single file with the plain private key to `/config/delegate/<any-file-name>`.
3. Use default public hard-coded private key (no way!).

The delegate account's private key will be picked up from the above methods in order if present.

## Is there anything missing?

❓ Do not hesitate to ask anything regarding delegated transactions [here](https://github.com/ZitRos/ethereum-delegated-tx-service/issues) (for back end and general inquiries), as well as [here](https://github.com/ZitRos/ethereum-delegated-tx-widget/issues)
(for front end / widget).

There is also an article coming soon, which will explain the concept in detail.