import express from "express";
import { loginRateLimiter } from "../middlewares/LoginRateLimitter.middlewares.js";
import { loginCustomer } from "../controllers/LoginCustomers.controller.js";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import { loginCustomersSchema } from "../validations/CustomerLogin.validations.js";

const LoginCustomersRouter = express.Router();
LoginCustomersRouter.post("/login", loginRateLimiter ,validateRequest(loginCustomersSchema) , loginCustomer);
export default LoginCustomersRouter