import express from "express";
import {createContract, getContractStatus, signContractSeller} from "../controllers/Contracts.controller.js"
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
const ContractRouter = express.Router()
ContractRouter.post("/orders/contract",authAdmin, createContract);
ContractRouter.patch("/orders/:orderId/contract", authAdmin , signContractSeller);
ContractRouter.get("/orders/:orderId/contract" , authAdmin , getContractStatus);
export default ContractRouter;