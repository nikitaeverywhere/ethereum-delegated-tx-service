import { Wallet } from "ethers";
import { getDelegatePrivateKey } from "../../../config";
import provider from "./provider";

let wallet;
let initMessage = true;

export async function getWallet () {
  const w = wallet ? wallet : wallet = await new Promise(async r => r(
    new Wallet(await getDelegatePrivateKey(), provider)
  ));
  if (initMessage) {
    console.log(`${ new Date().toISOString() } | Delegate address: ${ w.address }`);
    initMessage = false;
  }
  return w;
}
