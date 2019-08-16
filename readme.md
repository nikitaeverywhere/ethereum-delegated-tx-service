# Ethereum Delegated Transactions Universal Back End

A containerized back end for Ethereum smart contracts that support delegated transactions.

## Demo

TBD

## Delegated Transactions Concept (Ethereum v1)

TBD

## How Does It Work?

This back end works for any smart contracts (like token smart contracts) which support delegated transactions, or, in other words, have function analogues that allow delegation by signature and **paying fee in tokens instead of Ether**. Signature example:

```javascript
 // Standard function
erc20Token.transfer(to, value)
 // Delegated function
erc20Token.transferViaSignature(to, value, fee, feeRecipient, deadline, sigId, sig, sigStandard)
```

TBD

## Development

You will need [Docker](https://www.docker.com) with Docker Compose installed to launch a thing. Then, run the following:

```bash
bash docker-compose.sh # *nix
```

Later, in the container, run

```bash
npm run start
```