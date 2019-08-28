import uuid from "uuid/v4";
import { getManifest, ethereumGlobalConfig, instanceConfig } from "../../config";
import { contextUtils } from "./context";
import { getContract, provider } from "./ethers";
import { DelegateRequest } from "../db";
import { syncAndPublish } from "./transactions";

async function getEthToUsd () {
  for (const { endpoint, getter, cacheDuration } of instanceConfig.ethToUsdPriceEndpoints) {
    try {
      let res = await contextUtils.httpGetWithCache(endpoint, {
        cacheFor: cacheDuration || 5 * 60 * 1000,
        throwOnErrors: true
      });
      if (typeof(getter) === "function") {
        res = getter(res);
      }
      return res;
    } catch (e) {
      console.warn(`Endpoint ETH/USD retrieval failed for ${ endpoint } (${ e }), switching to the next endpoint`);
    }
  }
  return 999999999;
}

export async function getRequestById (requestId) {
  return await DelegateRequest.findOne({
    id: requestId
  });
}

export async function createRequest ({ contractAddress, functionName, functionArguments, signer, gasLimit, ...rest }) {

  const manifest = await getManifest(contractAddress);
  const { delegatedFunctions } = manifest;
  const functionManifest = delegatedFunctions.find(f => f.functionName === functionName);
  const contract = await getContract(contractAddress);

  functionArguments = functionArguments || [];

  const baseContext = {
    ...rest,
    contract: {
      address: contractAddress,
      decimals: +(await contract.decimals())
    },
    functionName,
    functionArguments,
    signer,
    gasPriceWei: +(await provider.getGasPrice()), // Todo: cache
    ethToUsd: await getEthToUsd(),
    gasLimit: rest.gasLimit, // May not be specified
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
    signer,
    ...response
  });

  return delegateRequest;

}

export async function confirmRequest (requestId, signatureStandard, signature) {
  
  const now = new Date();
  const request = await DelegateRequest.findOne({
    id: requestId,
    expiresAt: {
      $gte: now
    }
  });

  if (!request) {
    throw new Error(`No delegated request with id=${ requestId } was made or it has expired. First, make a delegated request and only then send a signature.`);
  }
  if (!(request.signatureOptions instanceof Array)) {
    throw new Error(`Something bad with request id=${ requestId }, it has no signatureOptions recorded`);
  }
  if (request.status !== DelegateRequest.status.new) {
    throw new Error(`The request ${ requestId } has already been confirmed`);
  }

  const sigOption = request.signatureOptions.find(o => o.standard === signatureStandard);

  if (!sigOption) {
    throw new Error(`Signature standard signatureStandard=${ signatureStandard } is not supported (available signature standards: '${ request.signatureOptions.map(o => o.standard).join("', '") }')`);
  }
  if (!request.context || !request.context.contract || !request.context.contract.address || !request.context.functionName) {
    throw new Error(`Request id=${ requestId } has a broken context :(`);
  }

  // Todo: check instanceConfig.maxPendingTransactions

  // Temp
  request.context.signature = signature;
  request.context.signatureStandard = signatureStandard;

  const [manifest, contract] = await Promise.all([
    getManifest(request.context.contract.address),
    getContract(request.context.contract.address)
  ]);
  const functionManifest = manifest.delegatedFunctions.find(f => f.functionName === request.context.functionName);

  if (!functionManifest) {
    throw new Error(`Manifest for function '${ request.context.functionName }' not found`);
  }

  const delegatedFunctionName = functionManifest.delegatedFunctionName;
  const delegatedFunctionArguments = await functionManifest.delegatedFunctionArguments(request.context);
  const maxPendingTransactionsPerAccount = manifest.maxPendingTransactionsPerAccount || ethereumGlobalConfig.maxPendingTransactionsPerAccount;
  let gasLimitEstimate;

  try {
    gasLimitEstimate = +(await contract.estimate[delegatedFunctionName].apply(contract.estimate, delegatedFunctionArguments.concat({
      from: request.signer
    })));
  } catch (e) {
    throw new Error(`Function call estimation error: either invalid signature is given or delegate function errors when calling ${ delegatedFunctionName }('${ delegatedFunctionArguments.join("', '") }')`);
  }

  if (gasLimitEstimate > request.context.gasLimit) {
    throw new Error(`An actual transaction gas ${ gasLimitEstimate } exceeds requested gas limit ${ request.context.gasLimit }. Provide a higher 'gasLimit' in the delegated transaction request to confirm this transaction`);
  }

  const previousTransactions = await DelegateRequest.findCount({ expiresAt: { $gt: new Date(0) }, status: { $ne: DelegateRequest.status.new }, signer: request.signer });
  if (previousTransactions > maxPendingTransactionsPerAccount) {
    throw new Error(`Unable to submit more than ${ maxPendingTransactionsPerAccount } transactions for the same signer ${ request.signer }. Confirm and wait until ${ previousTransactions } previous transactions are mined`);
  }

  const { value } = await DelegateRequest.findOneAndUpdate({
    _id: request._id,
    status: DelegateRequest.status.new // Prevents concurrency vulnerabilities
  }, {
    $set: {
      status: DelegateRequest.status.confirmed,
      signature,
      signatureStandard,
      delegatedFunctionName,
      delegatedFunctionArguments
    }
  });

  // await syncAndPublish(); // Temporarily (should be in a separate worker)

  return value;

}
