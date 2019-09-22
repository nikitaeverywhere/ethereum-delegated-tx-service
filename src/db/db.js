import { MongoClient } from "mongodb";
import { mongodbConfig } from "../../config";
import { getPrintableMongodbURL } from "../utils";

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
        rej(new Error(`Unable to connect to ${ getPrintableMongodbURL(mongodbConfig.url) }: ${ err }`));
        return;
      }
      dbClient = client.db(mongodbConfig.dbName);
      res(dbClient);
  }));
};

export const getCollection = async (colName) => (await getDb()).collection(colName);
