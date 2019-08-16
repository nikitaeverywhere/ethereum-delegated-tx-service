import { getCollection } from "../db";
import { instanceConfig } from "../../../config";

let collectionPromise = getCollection("delegate-request");

(async function initIndexes () {
  const collection = await collectionPromise;
  await collection.createIndex({
    id: 1
  }, {
    unique: true
  });
  await collection.createIndex({
    expiresAt: 1,
    status: 1,
    signer: 1
  });
})();

export async function create ({ id, context, signer, fee, signatureOptions }) {
  const collection = await collectionPromise;
  const now = new Date();
  const result = await collection.insertOne({
    id,
    status: "new", // "pending" || "mining" || "mined"
    signer,
    context,
    fee,
    signatureOptions,
    createdAt: now,
    expiresAt: context.expiresAt
      ? new Date(context.expiresAt * 1000)
      : new Date(now.getTime() + instanceConfig.defaultExpiresAtSeconds * 1000)
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
