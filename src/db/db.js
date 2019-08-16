import { MongoClient } from "mongodb";
import { mongodbConfig } from "../../config";

let dbClient = null;

// Usage:
// const db = await getDb();
// ...
export const getDb = async () => {
  if (dbClient) {
    return dbClient; // Promise || value
  }
  return dbClient = new Promise((res, rej) => MongoClient.connect(mongodbConfig.url, (err, client) => {
      if (err) {
        dbClient = null;
        rej(err);
      }
      dbClient = client.db(mongodbConfig.dbName);
      res(dbClient);
  }));
};

export const getCollection = async (colName) => (await getDb()).collection(colName);
