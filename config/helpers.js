import { readdirSync } from "fs";
import { ethereumGlobalConfig } from "./config";

const delegateFiles = readdirSync(`${ __dirname }/delegate`);
const manifestErrorPrefix = (address) => `Manifest validation failed for ${ address }:`;

const contractsPath = `${ __dirname }/contracts/${ ethereumGlobalConfig.networkName }`;
const registeredContractAddresses = readdirSync(contractsPath);
const registeredContractsPromise = (async () => ( // address => { abi, manifest }
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

export async function getDelegatePrivateKey (delegateFile = delegateFiles[0]) {
  if (!delegateFiles.length) {
    throw new Error("No delegates found in /config/delegate/*. Put a delegate private key there in the next format: { \"privateKey\": \"ABC...BCA\" }.");
  }
  const json = await import(`./delegate/${ delegateFile }`); // Cached
  return json.privateKey;
}

export async function getSupportedContracts () {
  const map = await registeredContractsPromise;
  const contracts = [];
  for (const [address, { manifest, abi }] of map.entries()) {
    contracts.push({
      address,
      implements: [
        isErc20(abi) && "ERC20",
        isErc721(abi) && "ERC721"
      ].filter(o => !!o),
      functions: manifest.delegatedFunctions.map(f => ({
        name: f.functionName,
        arguments: (abi.find(o => o.name === f.functionName) || { inputs: [] }).inputs
      }))
    });
  }
  return contracts;
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

function isErc20 (abi) {
  const signatures = new Set();
  for (const i of abi) {
    signatures.add(`${ i.name }(${ i.inputs.map(inp => inp.type).join(",") })`);
  }
  return signatures.has("transfer(address,uint256)")
    && signatures.has("transferFrom(address,address,uint256)")
    && signatures.has("approve(address,uint256)")
    && signatures.has("decimals()")
    && signatures.has("totalSupply()")
    && signatures.has("balanceOf(address)");
}

function isErc721 (abi) {
  const signatures = new Set();
  for (const i of abi) {
    signatures.add(`${ i.name }(${ i.inputs.map(inp => inp.type).join(",") })`);
  }
  return signatures.has("transfer(address,uint256)")
    && signatures.has("transferFrom(address,address,uint256)")
    && signatures.has("approve(address,uint256)")
    && signatures.has("ownerOf(uint256)");
}
