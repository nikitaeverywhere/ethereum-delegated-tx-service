import { registeredContractsPromise } from "../../config";
import { getContract } from "./ethers";
import { isErc20, isErc721 } from "../utils";

async function getConstants (contractAddress, implementsStandards = []) {
  const map = {};
  if (implementsStandards.indexOf("ERC20") !== -1) {
    const contract = await getContract(contractAddress);
    const [symbol, decimals] = await Promise.all([
      contract.functions.symbol(),
      contract.functions.decimals(),
    ]);
    map.symbol = symbol;
    map.decimals = decimals;
  }
  return map;
}

async function getSupportedContracts () {
  const map = await registeredContractsPromise;
  const contracts = [];
  for (const [address, { manifest, abi }] of map.entries()) {
    const implementsStandards = [
      isErc20(abi) && "ERC20",
      isErc721(abi) && "ERC721"
    ].filter(o => !!o);
    contracts.push({
      address,
      implements: implementsStandards,
      constants: await getConstants(address, implementsStandards),
      functions: manifest.delegatedFunctions.map(f => ({
        name: f.functionName,
        arguments: (abi.find(o => o.name === f.functionName) || { inputs: [] }).inputs
      }))
    });
  }
  return contracts;
}

// Supposed to run only once (as it is constant)
export const supportedContractsPromise = getSupportedContracts();