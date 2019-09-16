const networkName = process.env.NETWORK_NAME || "kovan";

export const apiConfig = {
  host: "0.0.0.0",
  port: process.env.API_PORT || 8088,
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*"
};

export const mongodbConfig = {
  url: process.env.MONGODB_URL || "mongodb://SET.MONGODB_URL.ENV.VARIABLE.PLEASE:27017",
  dbName: process.env.MONGODB_DB_NAME || `ethereum-delegated-tx-${ networkName }`
};

export const ethereumGlobalConfig = {
  networkName: networkName, // Global network for entire back end. If you need multiple networks, run multiple back ends.
  rpcProviders: process.env.RPC_PROVIDERS ? process.env.RPC_PROVIDERS.split(",") : [ // RPC endpoints
    `https://${ networkName }.infura.io/v3/26330e580e9d49ffb91482c15a92e86a`
  ],
  etherscanProviderApiKey: process.env.ETHERSCAN_API_KEY || "", // Fallback to Etherscan provider if specified
  requiredConfirmations: 3 // How many confirmations are required until the transaction is treated as mined
};

export const instanceConfig = {
  maxPendingTransactionsPerAccount: +process.env.MAX_PENDING_TX_PER_ACCOUNT || 5,
  maxPendingTransactions: 50, // Currently unused
  requestExpiresAfterSeconds: 30 * 60, // Number of seconds the delegated transaction request is alive
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
