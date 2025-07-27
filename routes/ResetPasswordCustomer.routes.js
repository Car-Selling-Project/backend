import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import resetPasswordSchema from "../validations/CustomerResetPassword.validations.js";
import { resetPassword, checkEmailExists } from "../controllers/ResetPasswordCustomer.controller.js";
import { resetPasswordLimiter } from "../middlewares/ResetPasswordLimiter.middlewares.js";
import checkEmailExistsSchema from "../validations/CheckEmail.validations.js";

const resetPasswordCustomerRouter = express.Router();

// ✅ Route 1: Kiểm tra email tồn tại
resetPasswordCustomerRouter.post("/forgot-password", validateRequest(checkEmailExistsSchema) ,checkEmailExists);

// ✅ Route 2: Đặt lại mật khẩu
resetPasswordCustomerRouter.patch(
  "/reset-password",
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);

export default resetPasswordCustomerRouter;
