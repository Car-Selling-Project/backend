import express from "express";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
import { createPayment, confirmPayment, cancelPayment , getPaymentForAdmin  , getPaymentForCustomer } from "../controllers/Payment.controller.js";

const PaymentRouter = express.Router();

// ---------------- Customer routes ----------------
PaymentRouter.post("/payment", authCustomer, createPayment);
PaymentRouter.patch("/payments/cancel", authCustomer, cancelPayment);
PaymentRouter.get("/payments", authCustomer, getPaymentForCustomer);

// ---------------- Admin routes ----------------
PaymentRouter.patch("/payment/:id/confirm", authAdmin, confirmPayment);
PaymentRouter.patch("/payment/cancel", authAdmin, cancelPayment);
PaymentRouter.get("/payment/:orderId", authAdmin, getPaymentForAdmin);
export default PaymentRouter;
