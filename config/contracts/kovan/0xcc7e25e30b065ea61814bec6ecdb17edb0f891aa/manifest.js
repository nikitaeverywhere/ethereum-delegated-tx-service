const defaultContext = (opts) => async (context) => { // Adds returned properties to context prior to requestHandler. Can have side effects and is saved to DB prior to response
  const gasLimit =
    (context.gasLimit && typeof context.gasLimit === "function"
      ? await context.gasLimit(context)
      : context.gasLimit)
    || (opts.gasLimit && typeof opts.gasLimit === "function"
      ? await opts.gasLimit(context)
      : opts.gasLimit)
    || 200000;
  return {
    signatureId: context.utils.randomInt32(),  // "nonce": use DB/Ethereum calls in case your token counts nonce
    expiresAt: Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000).toString(),
    gasLimit,
    calculatedTokenFee: context.utils.multiply(
      Math.pow(10, context.contract.decimals),
      ...(await Promise.all([
        context.utils.httpGetWithCache("https://kuna.io/api/v2/tickers/dreambtc"),
        context.utils.httpGetWithCache("https://kuna.io/api/v2/tickers/btcusd")
      ])).map(res => 1 / res.ticker.last),
      +context.gasPriceWei / Math.pow(10, 18), // = gas price in ETH
      context.ethToUsd,
      gasLimit, // Gas limit of a delegated function, not the original one (!)
      2 // x2 to finally get profit out of delegated transaction
    ).toString().replace(/\..+$/, ""),
    feeRecipient: "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A"
  };
};

export const maxPendingTransactionsPerAccount = 5; // Should be 1 for nonce-based delegated tx implementation

export const delegatedFunctions = [
  {
    functionName: "transfer",
    requestContext: defaultContext({
      // By this contract, gasLimit is determined as a call to the transfer function
      // + additional gas for transferViaSignature which is pretty much constant (~51000-52000 gas).
      gasLimit: async (context) => 46000 + await context.utils.getOriginalFunctionGasEstimate()
    }),
    requestHandler: (context) => ({ // Response generator, must use context only
      fee: context.calculatedTokenFee,
      signatureOptions: [
        {
          standard: context.utils.signatureStandards.eth_signTypedData,
          dataToSign: [
            {
              "type": "address",
              "name": "Token Contract Address",
              "value": context.contract.address
            },
            {
              "type": "address",
              "name": "Sender's Address",
              "value": context.signer
            },
            {
              "type": "address",
              "name": "Recipient's Address",
              "value": context.functionArguments[0] // to
            },
            {
              "type": "uint256",
              "name": "Amount to Transfer (last six digits are decimals)",
              "value": context.functionArguments[1] // value
            },
            {
              "type": "uint256",
              "name": "Fee in Tokens Paid to Executor (last six digits are decimals)",
              "value": context.calculatedTokenFee
            },
            {
              "type": "address",
              "name": "Account which Receives Fee",
              "value": context.feeRecipient
            },
            {
              "type": "uint256",
              "name": "Signature Expiration Timestamp (unix timestamp)",
              "value": context.expiresAt
            },
            {
              "type": "uint256",
              "name": "Signature ID",
              "value": context.signatureId
            }
          ]
        },
        {
          standard: context.utils.signatureStandards.eth_personalSign,
          dataToSign: context.utils.keccak256(
            ["address", "address", "address", "uint256", "uint256", "address", "uint256", "uint256"],
            [
              context.contract.address,
              context.signer,
              context.functionArguments[0],
              context.functionArguments[1],
              context.calculatedTokenFee,
              context.feeRecipient,
              context.expiresAt,
              context.signatureId
            ]
          )
        }
      ]
    }),
    delegatedFunctionName: "transferViaSignature",
    delegatedFunctionArguments: (context) => [
      context.signer, // address     from,
      context.functionArguments[0], // address     to,
      context.functionArguments[1], // uint256     value,
      context.calculatedTokenFee, // uint256     fee,
      context.feeRecipient, // address     feeRecipient,
      context.expiresAt, // uint256     deadline,
      context.signatureId, // uint256     sigId,
      context.signature, // bytes       sig,
      ({ // sigStandard sigStd
        [context.utils.signatureStandards.eth_signTypedData]: 0,
        [context.utils.signatureStandards.eth_personalSign]: 1,
        [undefined]: 2
      })[context.signatureStandard]
    ]
  },
  {
    functionName: "approveAndCall",
    requestContext: defaultContext({
      // By this contract, gasLimit is determined as a call to the approveAndCall function
      // + additional gas for approveAndCallViaSignature which is pretty much constant (~51000-52000 gas).
      gasLimit: async (context) => 52000 + await context.utils.getOriginalFunctionGasEstimate()
    }),
    requestHandler: (context) => ({ // Response generator, must use context only
      fee: context.calculatedTokenFee,
      signatureOptions: [
        {
          standard: context.utils.signatureStandards.eth_signTypedData,
          dataToSign: [
            {
              "type": "address",
              "name": "Token Contract Address",
              "value": context.contract.address
            },
            {
              "type": "address",
              "name": "Withdrawal Approval Address",
              "value": context.signer
            },
            {
              "type": "address",
              "name": "Withdrawal Recipient Address",
              "value": context.functionArguments[0] // to
            },
            {
              "type": "uint256",
              "name": "Amount to Transfer (last six digits are decimals)",
              "value": context.functionArguments[1] // value
            },
            {
              "type": "bytes",
              "name": "Data to Transfer",
              "value": context.functionArguments[2] // extraData
            },
            {
              "type": "uint256",
              "name": "Fee in Tokens Paid to Executor (last six digits are decimals)",
              "value": context.calculatedTokenFee
            },
            {
              "type": "address",
              "name": "Account which Receives Fee",
              "value": context.feeRecipient
            },
            {
              "type": "uint256",
              "name": "Signature Expiration Timestamp (unix timestamp)",
              "value": context.expiresAt
            },
            {
              "type": "uint256",
              "name": "Signature ID",
              "value": context.signatureId
            }
          ]
        },
        {
          standard: context.utils.signatureStandards.eth_personalSign,
          dataToSign: context.utils.keccak256(
            ["address", "address", "address", "uint256", "bytes", "uint256", "address", "uint256", "uint256"],
            [
              context.contract.address,
              context.signer,
              context.functionArguments[0],
              context.functionArguments[1],
              context.functionArguments[2],
              context.calculatedTokenFee,
              context.feeRecipient,
              context.expiresAt,
              context.signatureId
            ]
          )
        }
      ]
    }),
    delegatedFunctionName: "approveAndCallViaSignature",
    delegatedFunctionArguments: (context) => [
      context.signer, // address     from,
      context.functionArguments[0], // address     to,
      context.functionArguments[1], // uint256     value,
      context.functionArguments[2], // bytes     extraData,
      context.calculatedTokenFee, // uint256     fee,
      context.feeRecipient, // address     feeRecipient,
      context.expiresAt, // uint256     deadline,
      context.signatureId, // uint256     sigId,
      context.signature, // bytes       sig,
      ({ // sigStandard sigStd
        [context.utils.signatureStandards.eth_signTypedData]: 0,
        [context.utils.signatureStandards.eth_personalSign]: 1,
        [undefined]: 2 // Unused
      })[context.signatureStandard]
    ]
  }
];