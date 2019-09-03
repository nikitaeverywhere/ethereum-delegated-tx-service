# Ethereum Delegated Transactions Universal Back End

Elegant Ethereum delegated transactions implementation.

Primarily, delegated transactions, or meta transactions allow users to pay fee in tokens instead of Ether, making crypto user experience great again. This back end is shipped with [configurable widget](https://github.com/ZitRos/ethereum-delegated-tx-widget), which can be used for any token or smart contract supporting doing-something-via-signature.

+ Allows users to pay fee in tokens instead of Ether, making crypto UX great again
+ Universal back end **for any Ethereum contract implementation**
+ Signature standard-free (use whatever your contract/token supports)
+ Features the simplest API possible (`/request` - `/confirm` - `/status`)
+ Ships with [highly-configurable UI](https://zitros.github.io/ethereum-delegated-tx-widget/)

<p align="center">
  <br/><b><a href="https://zitros.github.io/ethereum-delegated-tx-widget/" target="_blank">---> CHECK THE DEMO HERE! <---</a></b><br/><br/>
  <img src="https://user-images.githubusercontent.com/4989256/64173367-cbec8080-ce5f-11e9-87c3-c1c77ae83dc4.png" alt="screenshot" width="360">
</p>

## Delegated Transactions Concept

- ✔ Any token implementation (which supports delegated transactions, for example, [DREAM](https://etherscan.io/token/0x82f4ded9cec9b5750fbff5c2185aee35afc16587))
- ✔ Any signature standard (supported by wallets)
- ⚠ Only manifest file is required for each token (see `/config/contracts`)

This back end works for any smart contracts (primarily for token smart contracts) which support delegated transactions. By design, such smart contracts should expose functions which allow to run its "original functions" by signature, or, in other words, allowing to **avoid paying fee in Ether**. For instance:

```javascript
//         ↓↓↓↓↓↓↓↓ Original function
erc20Token.transfer(to, value)
//                  ↑↑  ↑↑↑↑↑ Original arguments

//         ↓↓↓↓↓↓↓↓ Delegated function
erc20Token.transferViaSignature(to, value, fee, feeRecipient, deadline, sigId, sig, sigStandard)
//                    Additional arguments ↑↑↑  ↑↑↑↑↑↑↑↑↑↑↑↑  ↑↑↑↑↑↑↑↑  ↑↑↑↑↑  ↑↑↑  ↑↑↑↑↑↑↑↑↑↑↑
```

(more information will be provided soon)

## Workflow

To perform a delegated transaction, client performs 2 steps (+ 1 optional step to check the status of transaction):

### 1. The client requests metadata for a particular function call (in this example, `transfer(...)`).

```javascript
// >>>>>> POST /request
{
	"contractAddress": "0xcc7e25e30b065ea61814bec6ecdb17edb0f891aa",
	"signer": "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A",
	"functionName": "transfer",
	"functionArguments": ["0xeee835EaaD87175E20aC048F9E5592CFbEf9161D", "6000000"]
}

// <<<<<< (response)
{
  "request": {
    "id": "fbf098f2-e676-4b6c-9b73-f24fe1da2b9d",
    "fee": "901918",
    "expiresAt": "2019-09-03T14:19:37.482Z",
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

### 2. Once the client signs returned data, a confirmation is sent to back end.

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
  "status": "mining", // new | confirmed | mining | mined | failed
  "transactionHash": "0x86446fcecd73b96cbc1df17c5a7abf18aa228f276338794fbb565925d06bfba6", // Use as info field only (there is a potential upcoming upgrade to re-publish transactions once gas price increases, hence, transaction hash can change)
  "reason": "When status is failed, a reason will be provided"
}
```

## Development

You will need [Docker](https://www.docker.com) with Docker Compose installed to launch a thing. Then, run the following:

```bash
bash docker-compose.sh # *nix
```

Later, in the container, run

```bash
npm run start
```

Then open `http://localhost:8088`.