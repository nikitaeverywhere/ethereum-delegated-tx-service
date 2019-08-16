import { readdirSync } from "fs";

export const apiConfig = {
  host: "0.0.0.0",
  port: 80
};

export const mongodbConfig = {
  url: "mongodb://mongo:27017", // === "mongo" in docker-compose.yml
  dbName: "test"
};

export const ethereumGlobalConfig = {
  networkName: "mainnet",
  rpcProviders: [ // RPC endpoints
    "https://mainnet.infura.io/v3/26330e580e9d49ffb91482c15a92e86a"
  ],
  etherscanProviderApiKey: "" // Fallback to Etherscan provider if specified
};

export const instanceConfig = {
  maxPendingTransactionsPerAccount: 5,
  defaultExpiresAtSeconds: 60 * 60, // If manifest does not add "expiresAt" to context, this value is used as ${now} + ${defaultRequestExpirationSeconds}
}

///////////////////////////////////////////////////////////////////

const delegateFiles = readdirSync(`${ __dirname }/delegate`);
const manifestErrorPrefix = (address) => `Manifest validation failed for ${ address }:`;

export async function getAbi (contractAddress) {
  const m = await import(`./abi/${ contractAddress.toLowerCase() }.json`); // Cached
  return m.default;
}

export async function getManifest (contractAddress) {
  let manifest;
  contractAddress = contractAddress.toString().toLowerCase();
  try {
    manifest = await import(`./manifest/${ contractAddress }.js`); // Cached
  } catch (e) {
    throw new Error(`No delegated transactions support for contract ${ contractAddress }; manifest file manifest/${ contractAddress }.json not found`);
  }
  const validationError = validateManifest(manifest, contractAddress);
  if (validationError) {
    throw new Error(validationError);
  }
  return manifest;
}

export async function getDelegatePrivateKey (delegateFile = delegateFiles[0]) {
  if (!delegateFiles.length) {
    throw new Error("No delegates found in /config/delegate/*. Put a delegate private key there in the next format: { \"privateKey\": \"ABC...BCA\" }.");
  }
  const json = await import(`./delegate/${ delegateFile }`); // Cached
  return json.privateKey;
}

function validateManifest (manifest, address = "0x<unknown>") {

  const { delegatedFunctions, maxPendingTransactionsPerAccount } = manifest;

  if (typeof(maxPendingTransactionsPerAccount) !== "undefined" && (
    typeof(maxPendingTransactionsPerAccount) !== "number"
    || maxPendingTransactionsPerAccount < 1
  )) {
    return `${ manifestErrorPrefix(address) } manifest.maxPendingTransactionsPerAccount is not a number or is less than 1`;
  }

  if (!(delegatedFunctions instanceof Array)) {
    return `${ manifestErrorPrefix(address) } manifest.delegatedFunctions must be exported and must be an array`;
  }

  // Todo: more validation

}