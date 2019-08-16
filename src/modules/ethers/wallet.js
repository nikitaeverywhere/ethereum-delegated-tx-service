import { Wallet } from "ethers";
import { getDelegatePrivateKey } from "../../../config";
import provider from "./provider";

let wallet;

export async function getWallet () {
  return wallet ? wallet : wallet = new Promise(async r => r(
    new Wallet(await getDelegatePrivateKey(), provider)
  ));
}
