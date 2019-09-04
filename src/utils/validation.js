import { errors } from "ethers";

export const isValidEthereumAddress = (address) => typeof(address) === "string" && address.match(/^0x[0-9A-F]{40}$/i);

export const isNonceTooLowError = (e) =>
  e.code === errors.NONCE_EXPIRED ||
  e.code === errors.REPLACEMENT_UNDERPRICED ||
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /too\slow/i.test(e.message)) || // Harder
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /used/i.test(e.message)) || // Even more harder
  (typeof(e.message) === 'string' && /nonce/i.test(e.message) && /already/i.test(e.message)); // C'mon, libraries!

export function isErc20 (abi) {
  const signatures = new Set();
  for (const i of abi) {
    signatures.add(`${ i.name }(${ i.inputs.map(inp => inp.type).join(",") })`);
  }
  return signatures.has("transfer(address,uint256)")
    && signatures.has("transferFrom(address,address,uint256)")
    && signatures.has("approve(address,uint256)")
    && signatures.has("decimals()")
    && signatures.has("totalSupply()")
    && signatures.has("balanceOf(address)");
}

export function isErc721 (abi) {
  const signatures = new Set();
  for (const i of abi) {
    signatures.add(`${ i.name }(${ i.inputs.map(inp => inp.type).join(",") })`);
  }
  return signatures.has("transfer(address,uint256)")
    && signatures.has("transferFrom(address,address,uint256)")
    && signatures.has("approve(address,uint256)")
    && signatures.has("ownerOf(uint256)");
}
