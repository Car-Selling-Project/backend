import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import resetPasswordSchema from "../validations/CustomerResetPassword.validations.js";
import { resetPassword } from "../controllers/ResetPasswordCustomer.controller.js";
import { resetPasswordLimiter } from "../middlewares/ResetPasswordLimiter.middlewares.js";

const resetPasswordCustomerRouter = express.Router();

resetPasswordCustomerRouter.patch(
  "/reset-password",
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);

export default resetPasswordCustomerRouter;
