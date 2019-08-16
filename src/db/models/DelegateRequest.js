import { getCollection } from "../db";

let collectionPromise = getCollection("delegate-request");

(async function initIndexes () {
  const collection = await collectionPromise;
  collection.createIndex({
    id: 1,
    status: 1
  }, {
    unique: true
  });
})();

export async function create ({ id, context, fee, signatureOptions }) {
  const collection = await collectionPromise;
  const result = await collection.insertOne({
    id,
    status: "new",
    context,
    fee,
    signatureOptions
  });
  const doc = result.ops[0];
  delete doc._id;
  return doc;
}
