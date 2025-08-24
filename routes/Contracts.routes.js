import express from "express";
import {createContract, getContractStatusForCustomer, signContractBuyer, signContractSeller , getContractWithStatus} from "../controllers/Contracts.controller.js"
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";

const AdminContractRouter = express.Router();
AdminContractRouter.post("/orders/contract",authAdmin, createContract);
AdminContractRouter.patch("/orders/:orderId/seller-sign", authAdmin , signContractSeller);
AdminContractRouter.get("/orders/:orderId/contract" , authAdmin , getContractWithStatus);

const CustomerContractRouter = express.Router();
CustomerContractRouter.patch("/orders/:orderId/buyer-sign" , authCustomer ,signContractBuyer);
CustomerContractRouter.get("/orders/:orderId/contract" , authCustomer , getContractStatusForCustomer);

export { AdminContractRouter, CustomerContractRouter };