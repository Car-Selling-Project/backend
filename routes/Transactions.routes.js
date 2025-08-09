import express from "express";
import {authAdmin} from "../middlewares/AuthAdmins.middlewares.js";
import { createTransaction, deleteTransactionById, getAllTransactions, getRecentTransactions, getTransactionById, updateTransactionById } from "../controllers/Transactions.controller.js";
import {validateRequest} from "../middlewares/validateRequest.middlewares.js"
import {transactionUpdateValidationSchema} from "../validations/UpdateTransactions.validations.js"
import {transactionValidationSchema} from "../validations/Transactions.validations.js"
const TransactionRouter = express.Router();
TransactionRouter.get("/transactions/recent" , authAdmin , getRecentTransactions );
TransactionRouter.post("/transactions" , authAdmin , validateRequest(transactionValidationSchema) , createTransaction);
TransactionRouter.get("/transactions" , authAdmin , getAllTransactions);
TransactionRouter.get("/transactions/:id" , authAdmin , getTransactionById);
TransactionRouter.patch("/transactions/:id" , authAdmin , validateRequest(transactionUpdateValidationSchema) , updateTransactionById);
TransactionRouter.delete("/transactions/:id", authAdmin , deleteTransactionById)
export default TransactionRouter;