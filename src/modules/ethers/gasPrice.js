import provider from "./provider";

let cachedAt = 0;
let cachedValue = "";

export async function getGasPrice () {
  const now = Date.now();
  if (now - cachedAt < 1000 * 15 && cachedValue) { // 15 sec cache
    return cachedValue;
  }
  cachedValue = (await provider.getGasPrice()).add(100000000).toString();
  cachedAt = now;
  return cachedValue;
}
