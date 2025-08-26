import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import { resetPasswordLimiter } from "../middlewares/ResetPasswordLimiter.middlewares.js";
import {
  checkEmployeeCodeExists,
  resetAdminPassword,
} from "../controllers/ResetPasswordAdmins.controller.js";

import checkEmployeeCodeSchema from "../validations/CheckEmployeeCode.validations.js";
import resetPasswordAdminSchema from "../validations/AdminsResetPassword.validations.js";

const resetPasswordAdminRouter = express.Router();

// ✅ Route quên mật khẩu
resetPasswordAdminRouter.post(
  "/forgot-password",
  validateRequest(checkEmployeeCodeSchema),
  checkEmployeeCodeExists
);

// ✅ Route đặt lại mật khẩu
resetPasswordAdminRouter.post(
  "/reset-password",
  resetPasswordLimiter,
  validateRequest(resetPasswordAdminSchema),
  resetAdminPassword
);

export default resetPasswordAdminRouter;
