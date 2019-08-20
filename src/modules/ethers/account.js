import provider from "./provider";

export async function getTransactionCount (address) {
  return await provider.getTransactionCount(address);
}
