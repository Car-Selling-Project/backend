import express from "express";
import { loginRateLimiter } from "../middlewares/LoginRateLimitter.middlewares.js";
import { loginCustomer } from "../controllers/LoginCustomers.controller.js";
const LoginCustomersRouter = express.Router();
LoginCustomersRouter.post("/login", loginRateLimiter , loginCustomer);
export default LoginCustomersRouter