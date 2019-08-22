import asyncErrorHandler from "express-async-handler";
import { ethereumGlobalConfig, getSupportedContracts } from "../../../config";
import { getNetwork } from "ethers/utils/networks";

const supportedContractsPromise = getSupportedContracts();

export const handler = (app) => app.get("/", asyncErrorHandler(async (req, res) => {
  const network = getNetwork(ethereumGlobalConfig.networkName);
  return res.status(200).send({
    "service-name": "ethereum-delegated-transactions",
    "service-version": "1.0.0",
    "networkChainId": network.chainId,
    "networkName": network.name,
    "contracts": await supportedContractsPromise
  });
}));
