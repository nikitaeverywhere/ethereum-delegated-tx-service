import asyncErrorHandler from "express-async-handler";
import { getRequestById } from "../../modules/delegated-tx";
import { getStatusNameFromStatus } from "../../utils";

export const handler = (app) => app.get("/status/:requestId", asyncErrorHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await getRequestById(requestId);
  return res.status(request ? 200 : 404).send(request
    ? {
      result: {
        id: request.id,
        status: getStatusNameFromStatus(request.status),
        expiresAt: request.expiresAt,
        transactionHash: request.transactionHash,
        reason: request.reason
      }
    }
    : {
      error: `Request with requestId='${ requestId }' not found`
    }
  );
}));
