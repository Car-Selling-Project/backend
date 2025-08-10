import express from "express";
import {
  updateTransactionStatus,
  expirePendingTransactions
} from "../controllers/TransactionStatus.controller.js";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";

const TransactionStatusRouter = express.Router();

// Cập nhật trạng thái transaction
TransactionStatusRouter.patch("/transactions/:id/status",authAdmin, updateTransactionStatus);

// Hủy transaction pending quá 5 phút
TransactionStatusRouter.post("/transactions/expire",authAdmin, expirePendingTransactions);

export default TransactionStatusRouter;
