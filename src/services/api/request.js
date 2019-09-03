import asyncErrorHandler from "express-async-handler";
import { getManifest } from "../../../config";
import { getContract } from "../../modules/ethers";
import { isValidEthereumAddress } from "../../utils";
import { createRequest } from "../../modules/delegated-tx";

export const handler = (app) => app.post("/request", asyncErrorHandler(async (req, res) => {
  const error = await validateRequest(req);
  if (error) {
    return res.status(400).send({ error });
  }
  const { contractAddress, functionName, functionArguments, from, gasLimit } = req.body;
  let request;
  try {
    request = await createRequest({ contractAddress, functionName, functionArguments, from, gasLimit });
  } catch (e) {
    return res.status(400).send({ error: e.toString() });
  }
  res.status(200).send({
    request: {
      id: request.id,
      fee: request.fee,
      signatureOptions: request.signatureOptions,
      expiresAt: request.requestExpiresAt
    }
  });
}));

async function validateRequest (req) {
  let { contractAddress, functionName, functionArguments, from, gasLimit } = req.body;
  // functionArguments are not validated until response is generated
  if (!isValidEthereumAddress(contractAddress)) {
    return `Invalid parameter \`contractAddress\`=${ contractAddress } given, must be Ethereum address`;
  }
  if (!isValidEthereumAddress(from)) {
    return `Invalid parameter \`from\`=${ from } given, must be Ethereum address`;
  }
  if (typeof(functionName) !== "string") {
    return `Invalid parameter \`functionName\`=${ functionName } given, must be a string`;
  }
  if (typeof(functionArguments) !== "undefined") {
    if (!(functionArguments instanceof Array)) {
      return "`functionArguments` provided must be an array";
    }
    for (const arg in functionArguments) {
      if (typeof(functionArguments[arg]) !== "string") {
        return `functionArguments[${ arg }] must be a string`;
      }
    }
  } else {
    req.body.functionArguments = functionArguments = [];
  }
  let manifest, contract;
  try {
    [manifest, contract] = await Promise.all([
      getManifest(contractAddress),
      getContract(contractAddress)
    ]);
  } catch (e) {
    return e.toString();
  }
  if (!(manifest.delegatedFunctions || []).find(f => f.functionName === functionName)) {
    return `Function \`${ functionName }\` does not support delegation in contract ${ contractAddress }. Available functions: '${ (manifest.delegatedFunctions || []).map(f => f.functionName).join("', '") }'`;
  }
  if (typeof(gasLimit) !== "undefined" && (typeof(gasLimit) !== "number" || gasLimit <= 0)) {
    return `Invalid \`gasLimit\`=${gasLimit} provided`;
  }
  if (!contract.interface.functions[functionName]) {
    return `Function \`${ functionName }\` is not present in ABI of ${ contractAddress }`;
  }
  try {
    contract.interface.functions[functionName].encode(functionArguments);
  } catch (e) {
    return `Invalid \`functionArguments\` provided: ${ e }`;
  }
  return null;
}