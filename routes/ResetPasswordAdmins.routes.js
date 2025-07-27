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

resetPasswordAdminRouter.post(
  "/forgot-password",
  validateRequest(checkEmployeeCodeSchema),
  checkEmployeeCodeExists
);

resetPasswordAdminRouter.patch(
  "/reset-password",
  resetPasswordLimiter,
  validateRequest(resetPasswordAdminSchema),
  resetAdminPassword
);

export default resetPasswordAdminRouter;
