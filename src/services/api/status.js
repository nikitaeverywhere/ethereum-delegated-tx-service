import asyncErrorHandler from "express-async-handler";
import { getRequestById } from "../../modules/delegated-tx";
import { status as delegateRequestStatuses } from "../../db/models/DelegateRequest";

export const handler = (app) => app.get("/status/:requestId", asyncErrorHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await getRequestById(requestId);
  return res.status(request ? 200 : 404).send(request
    ? {
      result: {
        id: request.id,
        status: Object.entries(delegateRequestStatuses).find(([, i]) => i === request.status)[0],
        expiresAt: request.expiresAt,
        transactionHash: request.transactionHash
      }
    }
    : {
      error: `Request with requestId='${ requestId }' not found`
    }
  );
}));
