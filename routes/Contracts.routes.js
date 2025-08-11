import express from "express";
import {generateAndUploadContract, getContractStatus, signContractSeller} from "../controllers/Contracts.controller.js"
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
const ContractRouter = express.Router()
ContractRouter.post("/orders/:orderId/contract",authAdmin, generateAndUploadContract);
ContractRouter.patch("/orders/:orderId/contract", authAdmin , signContractSeller);
ContractRouter.get("/orders/:orderId/contract" , authAdmin , getContractStatus);
export default ContractRouter;