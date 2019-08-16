import asyncErrorHandler from "express-async-handler";

export const handler = (app) => app.get("/status", asyncErrorHandler(async (req, res) => {
  const { transactionId } = req.body;
  
}));
