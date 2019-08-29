import { errors } from "ethers";

export const isValidEthereumAddress = (address) => typeof(address) === "string" && address.match(/^0x[0-9A-F]{40}$/i);

export const isNonceTooLowError = (e) =>
  e.code === errors.NONCE_EXPIRED ||
  e.code === errors.REPLACEMENT_UNDERPRICED ||
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /too\slow/i.test(e.message)) || // Harder
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /used/i.test(e.message)) || // Even more harder
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /already/i.test(e.message)); // C'mon, libraries!
