import { readdirSync, readFileSync } from "fs";
import { ethereumGlobalConfig } from "./config";

const delegateFiles = readdirSync(`${ __dirname }/delegate`) || [];
const manifestErrorPrefix = (address) => `Manifest validation failed for ${ address }:`;

const contractsPath = `${ __dirname }/contracts/${ ethereumGlobalConfig.networkName }`;
const registeredContractAddresses = readdirSync(contractsPath);
export const registeredContractsPromise = (async () => ( // address => { abi, manifest }
  await Promise.all(registeredContractAddresses.map(async address => {
    const [abiModule, manifest] = await Promise.all([
      import(`${ contractsPath }/${ address }/abi.json`),
      import(`${ contractsPath }/${ address }/manifest.js`)
    ]);
    return { address, abi: abiModule.default, manifest };
  }))
).reduce((map, v) => map.set(v.address, v) && map, new Map()))();

export async function getAbi (contractAddress) {
  contractAddress = contractAddress.toString().toLowerCase();
  const map = await registeredContractsPromise;
  if (!map.has(contractAddress)) {
    throw new Error(`This back end does not support delegated transactions for ${ contractAddress } (missing ${ contractsPath }/${ contractAddress }/abi.json)`);
  }
  return map.get(contractAddress).abi;
}

export async function getManifest (contractAddress) {
  contractAddress = contractAddress.toString().toLowerCase();
  const map = await registeredContractsPromise;
  if (!map.has(contractAddress)) {
    throw new Error(`This back end does not support delegated transactions for ${ contractAddress } (missing ${ contractsPath }/${ contractAddress }/manifest.js)`);
  }
  const manifest = map.get(contractAddress).manifest;
  const validationError = validateManifest(manifest, contractAddress);
  if (validationError) {
    throw new Error(validationError);
  }
  return manifest;
}

export async function getDelegatePrivateKey (delegateFile = delegateFiles.find(f => f.indexOf(".") !== 0)) {
  if (process.env.DELEGATE_PK) {
    return process.env.DELEGATE_PK;
  }
  if (delegateFile) {
    return readFileSync(`${ __dirname }/delegate/${ delegateFile }`).toString();
  }
  return "2CCA9531DB0839E6C11B4B318FAF801C4B425B16D0B6D89D6AC11FB61F6A5F4B";
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
