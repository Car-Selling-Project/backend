import { getAllCustomers } from "../controllers/GetCustomer.controller.js";
import express from "express";
const getAllCustomerRouter = express.Router();

getAllCustomerRouter.get("/allcustomer", getAllCustomers);

export default getAllCustomerRouter;
