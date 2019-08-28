export const apiConfig = {
  host: "0.0.0.0",
  port: 8088,
  allowedOrigins: '*'
};

export const mongodbConfig = {
  url: "mongodb://mongo:27017", // === "mongo" in docker-compose.yml
  dbName: "ethereum-delegated-tx"
};

export const ethereumGlobalConfig = {
  networkName: "kovan", // Global network for entire back end. If you need multiple networks, run multiple back ends.
  rpcProviders: [ // RPC endpoints
    "https://kovan.infura.io/v3/26330e580e9d49ffb91482c15a92e86a"
  ],
  etherscanProviderApiKey: "", // Fallback to Etherscan provider if specified
  requiredConfirmations: 3 // How many confirmations are required until the transaction is treated as mined
};

export const instanceConfig = {
  maxPendingTransactionsPerAccount: 5,
  maxPendingTransactions: 50,
  defaultExpiresAtSeconds: 60 * 60, // If manifest does not add "expiresAt" to context, this value is used as ${now} + ${defaultRequestExpirationSeconds}
  ethToUsdPriceEndpoints: [ // JSON endpoints. If one of them is not available, the next one is queried
    {
      endpoint: "https://api.coinmarketcap.com/v1/ticker/ethereum/",
      getter: (response) => +response[0].price_usd,
      cacheDuration: 60 * 5 // 5 min
    },
    {
      endpoint: "https://api.etherscan.io/api?module=stats&action=ethprice",
      getter: (response) => +response.result.ethusd,
      cacheDuration: 60 * 5 // 5 min
    }
  ]
};
