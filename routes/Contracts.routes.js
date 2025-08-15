import express from "express";
import {createContract, getContractStatus, getContractStatusForCustomer, signContractBuyer, signContractSeller} from "../controllers/Contracts.controller.js"
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";

const AdminContractRouter = express.Router();
AdminContractRouter.post("/orders/contract",authAdmin, createContract);
AdminContractRouter.patch("/orders/:orderId/contract", authAdmin , signContractSeller);
AdminContractRouter.get("/orders/:orderId/contract" , authAdmin , getContractStatus);

const CustomerContractRouter = express.Router();
CustomerContractRouter.patch("/orders/:orderId/contract" , authCustomer ,signContractBuyer);
CustomerContractRouter.get("/orders/:orderId/contract" , authCustomer , getContractStatusForCustomer);

export { AdminContractRouter, CustomerContractRouter };