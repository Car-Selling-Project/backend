import express from "express";
import { registerRateLimiter } from "../middlewares/RegisterRateLimitter.middlewares.js";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import { registerCustomer } from "../controllers/RegisterCustomers.controller.js";
import { customerSchema } from "../validations/Customers.validations.js";
const RegisterCustomersRouter = express.Router();
RegisterCustomersRouter.post(
    "/register",
    registerRateLimiter,
    validateRequest(customerSchema),
    registerCustomer
);
export default RegisterCustomersRouter;