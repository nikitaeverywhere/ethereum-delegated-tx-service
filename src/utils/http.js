import { get } from "axios";

const getCache = new Map(); // url => { cachedAt, response }

export const httpGetWithCache = async (url, { cacheFor = 60 * 1000, throwOnErrors = false } = {}) => {
  const cached = getCache.get(url) || { cachedAt: 0, response: null };
  if (cached.cachedAt + cacheFor > Date.now()) {
    return cached.response;
  }
  try {
    return (await get(url)).data;
  } catch (e) {
    if (throwOnErrors) {
      throw new Error(`Request to ${ url } failed: ${ e }`);
    }
    return cached.response || { error: e.toString() };
  }
};
