import asyncErrorHandler from "express-async-handler";
import { ethereumGlobalConfig } from "../../../config";
import { supportedContractsPromise } from "../../modules/metadata";
import { getNetwork } from "ethers/utils/networks";

export const handler = (app) => app.get("/", asyncErrorHandler(async (req, res) => {
  const network = getNetwork(ethereumGlobalConfig.networkName);
  return res.status(200).send({
    "service-name": "ethereum-delegated-transactions",
    "version": "1.0.0",
    "networkChainId": network.chainId,
    "networkName": network.name,
    "contracts": await supportedContractsPromise
  });
}));
