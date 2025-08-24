import express from "express";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
import {
  createPayment,
  confirmPayment,
  cancelPayment,
  getPaymentForAdmin,
  getPaymentForCustomer,
  stripeWebhook,
} from "../controllers/Payment.controller.js";

const PaymentRouter = express.Router();

// ---------------- Customer routes ----------------

// Customer tạo payment (Stripe hoặc COD)
PaymentRouter.post("/payments", authCustomer, createPayment);

// Customer xem chi tiết payment của 1 order
PaymentRouter.get("/payments/:orderId", authCustomer, getPaymentForCustomer);

// ---------------- Admin routes ----------------

// Admin xác nhận thanh toán (COD hoặc manual confirm)
PaymentRouter.patch("/payments/:id/confirm", authAdmin, confirmPayment);

// Admin hủy payment (COD hoặc manual cancel)
PaymentRouter.patch("/payments/:id/cancel", authAdmin, cancelPayment);

// Admin xem payment theo orderId
PaymentRouter.get("/admin/payments/:orderId", authAdmin, getPaymentForAdmin);

// ---------------- Stripe webhook ----------------
// ⚠️ Lưu ý: webhook phải dùng express.raw()
PaymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default PaymentRouter;
