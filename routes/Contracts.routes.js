import express from "express";
import {createContract, getContractStatus, getContractStatusForCustomer, signContractBuyer, signContractSeller} from "../controllers/Contracts.controller.js"
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
const ContractRouter = express.Router()
ContractRouter.post("/orders/contract",authAdmin, createContract);
ContractRouter.patch("/orders/:orderId/contract", authAdmin , signContractSeller);
ContractRouter.get("/orders/:orderId/contract" , authAdmin , getContractStatus);
ContractRouter.patch("/orders/:orderId/contract" , authCustomer ,signContractBuyer);
ContractRouter.get("/orders/:orderId/contract" , authCustomer , getContractStatusForCustomer);
export default ContractRouter;