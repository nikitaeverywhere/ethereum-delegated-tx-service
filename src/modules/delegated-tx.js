import uuid from "uuid/v4";
import { getManifest } from "../../config";
import { contextUtils } from "./context";
import { getContract } from "./ethers";
import { DelegateRequest } from "../db";

export async function createRequest ({ contractAddress, functionName, functionArguments, sender, gasLimit, ...rest }) {

  const manifest = await getManifest(contractAddress);
  const { delegatedFunctions } = manifest;
  const functionManifest = delegatedFunctions.find(f => f.functionName === functionName);
  const contract = await getContract(contractAddress);

  functionArguments = functionArguments || [];

  const baseContext = {
    contract: {
      address: contractAddress,
      decimals: +(await contract.decimals())
    },
    functionName,
    functionArguments,
    sender,
    gasPriceUsd: 1.89e-7, // 1 GWei, $180/ETH; Todo: provide;
    gasLimit,       // May not be specified
    utils: Object.assign({}, contextUtils)
  };

  const context = Object.assign(
    baseContext,
    functionManifest.requestContext
      ? await functionManifest.requestContext(baseContext)
      : {}
  );

  let response;

  try {
    response = await functionManifest.requestHandler(Object.assign({}, context)); 
  } catch (e) {
    console.error(e);
    throw new Error(`Error at manifest.requestHandler: ${ e }`);
  }

  const delegateRequest = await DelegateRequest.create({
    id: uuid(),
    context,
    ...response
  });

  return delegateRequest;

}

export async function confirmRequest (requestId, sigStandard, sig) {
  
}
