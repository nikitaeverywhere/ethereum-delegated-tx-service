import { randomBytes } from "crypto";
import { get } from "axios";
import { utils } from "ethers";

const getCache = new Map(); // url => { cachedAt, response }

export const contextUtils = {
  signatureStandards: {
    eth_signTypedData: "eth_signTypedData",
    eth_personalSign: "eth_personalSign"
  },
  randomInt32: () => `0x${ randomBytes(32).toString("hex") }`,
  httpGetWithCache: async (url, cacheFor = 60 * 1000) => {
    const cached = getCache.get(url) || { cachedAt: 0, response: null };
    if (cached.cachedAt + cacheFor > Date.now()) {
      return cached.response;
    }
    try {
      return (await get(url)).data;
    } catch (e) {
      return cached.response || { error: e.toString() };
    }
  },
  keccak256: (types, values) => utils.solidityKeccak256(types, values),
  multiply: (...args) => args.length ? args.reduce((acc, v) => acc * v, 1) : 0
};