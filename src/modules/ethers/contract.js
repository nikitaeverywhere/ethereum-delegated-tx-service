import { Contract } from "ethers";
import { getWallet } from "./wallet";
import { getAbi } from "../../../config";

export async function getContract (address) {
  return new Contract(address, await getAbi(address), await getWallet());
}