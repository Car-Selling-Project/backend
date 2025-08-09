import express from "express";
import {
  updateTransactionStatus,
  expirePendingTransactions
} from "../controllers/TransactionStatus.controller.js";

const TransactionStatusRouter = express.Router();

// Cập nhật trạng thái transaction
TransactionStatusRouter.patch("/:id/status", updateTransactionStatus);

// Hủy transaction pending quá 5 phút
TransactionStatusRouter.post("/expire", expirePendingTransactions);

export default TransactionStatusRouter;
