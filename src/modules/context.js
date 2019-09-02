import fromEntries from "fromentries";
import { randomBytes } from "crypto";
import { utils } from "ethers";
import { getContract } from "./ethers";
import { httpGetWithCache } from "../utils";

// In functions, this === request context
const contextUtils = {

  signatureStandards: {
    eth_signTypedData: "eth_signTypedData",
    eth_personalSign: "eth_personalSign"
  },

  randomInt32: () => `0x${ randomBytes(32).toString("hex") }`,
  keccak256: (types, values) => utils.solidityKeccak256(types, values),
  httpGetWithCache,

  /**
   * Multiplies all arguments. Todo: precision multiplication, dealing with big numbers (-> BigNumber -> String)
   */
  multiply: (...args) => args.length ? args.reduce((acc, v) => acc * v, 1) : 0,

  /**
   * Estimates gas for the current function in context (not the delegated one!).
   */
  getOriginalFunctionGasEstimate: async function () {
    const { contract: { address }, functionName, signer, functionArguments } = this;
    const smartContract = await getContract(address);
    return +(await smartContract.estimate[functionName].apply(smartContract.estimate, functionArguments.concat({ from: signer })));
  }

};

/**
 * Binds `utils` property to context.
 * @param {Object} context - Request context.
 * @returns {Object} - Context with utils property.
 */
export const bindContextUtils = (context) => (
  context.utils = fromEntries(Object.entries(contextUtils).map(
    ([p,v]) => [p,typeof v === "function" ? v.bind(context) : v])
  )
) && context;
