import express from "express";
import bodyParser from "body-parser";
import { apiConfig } from "../../../config";
import * as index from "./index-handler";
import * as request from "./request";
import * as confirm from "./confirm";
import * as status from "./status";

const app = express();

app.use(bodyParser.json());

index.handler(app);
request.handler(app);
confirm.handler(app);
status.handler(app);

app.use((err, _, res, next) => { // Express error handler
  if (res.headersSent) {
      return next(err);
  }
  console.error(err);
  return res.status(500).send({
    error: "An error ocurred. Error info was logged."
  });
});

export async function startApi () {
  return new Promise((resolve) => {
    app.listen(apiConfig.port, apiConfig.host, () => {
      console.info(`API is up on http://${ apiConfig.host }:${ apiConfig.port }`);
      resolve();
    });
  });
}
