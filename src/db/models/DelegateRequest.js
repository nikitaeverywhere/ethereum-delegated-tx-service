import { getCollection } from "../db";
import { delegateRequestStatuses } from "../../constants";
import { instanceConfig } from "../../../config";
import { isValidEthereumAddress } from "../../utils";

let collectionPromise = getCollection("delegate-request");

(async function initIndexes () {
  const collection = await collectionPromise;
  await collection.createIndex({
    id: 1
  }, {
    unique: true
  });
  await collection.createIndex({
    status: 1,
    requestExpiresAt: 1,
    from: 1
  });
})();

export async function create ({ id, context, from, fees, signatureOptions }) {
  if (!fees) {
    fees = [];
  }
  if (
    !(fees instanceof Array)
    || fees.find(f => !isValidEthereumAddress(f.address) || typeof f.value !== "string" || isNaN(f.value))
  ) {
    throw new Error(`Unable to save request: invalid "fees" returned by token manifest file: ${
      JSON.stringify(fees) }. Fees must be an array of objects. Example: [{ address: "0x...", value: "123", decimals: 6, symbol: "DREAM" }]`);
  }
  const collection = await collectionPromise;
  const now = new Date();
  const { utils, ...ctx } = context;
  const result = await collection.insertOne({
    id,
    status: delegateRequestStatuses.new,
    from,
    context: ctx,
    fees,
    signatureOptions,
    createdAt: now,
    requestExpiresAt: new Date(now.getTime() + instanceConfig.requestExpiresAfterSeconds * 1000)
  });
  const doc = result.ops[0];
  delete doc._id;
  return doc;
}

export async function findOne (q) {
  const collection = await collectionPromise;
  const result = await collection.findOne(q);
  return result;
}

export async function findOneAndUpdate (q, u) {
  const collection = await collectionPromise;
  const result = await collection.findOneAndUpdate(q, u, {
    returnNewDocument: true,
    returnOriginal: false
  });
  return result;
}

export async function find (q) {
  const collection = await collectionPromise;
  const result = await collection.find(q);
  return result;
}

export async function findCount (q) {
  const collection = await collectionPromise;
  const result = await collection.find(q).count;
  return result;
}

export async function collection () {
  return await collectionPromise;
}
