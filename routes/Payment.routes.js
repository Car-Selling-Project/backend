import express from "express";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
import { createPayment, confirmPayment, cancelPayment } from "../controllers/Payment.controller.js";

const PaymentRouter = express.Router();

// ---------------- Customer routes ----------------
PaymentRouter.post("/payment", authCustomer, createPayment);
PaymentRouter.patch("/payment/cancel", authCustomer, cancelPayment);
PaymentRouter.patch("/payment/confirm", authCustomer, confirmPayment);

// ---------------- Admin routes ----------------
PaymentRouter.patch("/payment/confirm", authAdmin, confirmPayment);
PaymentRouter.patch("/payment/cancel", authAdmin, cancelPayment);

export default PaymentRouter;
