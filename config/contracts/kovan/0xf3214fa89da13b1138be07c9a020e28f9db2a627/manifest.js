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
    calculatedTokenFee: "0",
    feeRecipient: "0xB3311c91d7c1B305DA3567C2320B716B13F24F8A"
  };
};

export const maxPendingTransactionsPerAccount = 5; // Should be 1 for nonce-based delegated tx implementation

export const delegatedFunctions = [
  {
    functionName: "claimAutograph",
    requestContext: defaultContext({
      // By this contract, gasLimit is determined as a call to the transfer function
      // + additional gas for transferViaSignature which is pretty much constant (~51000-52000 gas).
      gasLimit: 300000
    }),
    requestHandler: (context) => ({ // Response generator, must use context only
      fees: [
        {
          ...context.contract, // adds { address, decimals, symbol, implements: ["ERC20"] }
          value: context.calculatedTokenFee
        }
      ],
      signatureOptions: [
        {
          standard: context.utils.signatureStandards.eth_personalSign,
          dataToSign: context.utils.keccak256(
            ["address", "address", "uint256", "uint256",  "bytes"],
            [
              context.contract.address,
              context.from,
              context.functionArguments[0],
              context.functionArguments[1],
              context.functionArguments[4]
            ]
          )
        }
      ]
    }),
    delegatedFunctionName: "claimAutographWithSignature",
    delegatedFunctionArguments: (context) => !console.log([
      context.functionArguments[0], // address     to,
      context.functionArguments[1], // uint256     value,
      context.from,                 // address     from,
      context.functionArguments[3], // uint256     fee,
      context.functionArguments[4],
      context.signature
    ]) && [
      context.functionArguments[0], // address     to,
      context.functionArguments[1], // uint256     value,
      context.from,                 // address     from,
      context.functionArguments[3], // uint256     fee,
      context.functionArguments[4],
      context.signature
    ]
  }
];