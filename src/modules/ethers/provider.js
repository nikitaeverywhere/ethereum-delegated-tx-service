import { providers } from "ethers";
import { ethereumGlobalConfig } from "../../../config";

const ethersProviders = [];

for (const address of ethereumGlobalConfig.rpcProviders) {
  console.log(`${ new Date().toISOString() } | Blockchain provider: registered RPC API for ${ ethereumGlobalConfig.networkName } to ${ address }`);
  ethersProviders.push(new providers.JsonRpcProvider(address, ethereumGlobalConfig.networkName));
}
if (ethereumGlobalConfig.etherscanProviderApiKey) {
  ethersProviders.push(new providers.EtherscanProvider(ethereumGlobalConfig.networkName, ethereumGlobalConfig.etherscanProviderApiKey));
  console.log(`${ new Date().toISOString() } | Blockchain provider: registered Etherscan fallback RPC API for ${ ethereumGlobalConfig.networkName }`);
}

const fallbackProvider = new providers.FallbackProvider(ethersProviders);

export default fallbackProvider;