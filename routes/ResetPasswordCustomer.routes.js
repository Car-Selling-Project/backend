import express from "express";
import cors from "cors";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import resetPasswordSchema from "../validations/CustomerResetPassword.validations.js";
import { resetPassword, checkEmailExists } from "../controllers/ResetPasswordCustomer.controller.js";
import { resetPasswordLimiter } from "../middlewares/ResetPasswordLimiter.middlewares.js";
import checkEmailExistsSchema from "../validations/CheckEmail.validations.js";

const resetPasswordCustomerRouter = express.Router();

// ⚠️ Chỉ dùng CORS + credentials cho route cần cookie/session
const corsWithCredentials = cors({
  origin: "http://localhost:5173", // FE domain
  credentials: true,
});

// ✅ Route 1: Kiểm tra email tồn tại (không cần credentials)
resetPasswordCustomerRouter.post(
  "/forgot-password",
  validateRequest(checkEmailExistsSchema),
  checkEmailExists
);

// ✅ Route 2: Đặt lại mật khẩu (cần credentials nếu dùng cookie)
resetPasswordCustomerRouter.post(
  "/reset-password",
  corsWithCredentials,
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);

export default resetPasswordCustomerRouter;
