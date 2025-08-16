import express from "express";
import cors from "cors";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import { resetPasswordLimiter } from "../middlewares/ResetPasswordLimiter.middlewares.js";
import {
  checkEmployeeCodeExists,
  resetAdminPassword,
} from "../controllers/ResetPasswordAdmins.controller.js";

import checkEmployeeCodeSchema from "../validations/CheckEmployeeCode.validations.js";
import resetPasswordAdminSchema from "../validations/AdminsResetPassword.validations.js";

const resetPasswordAdminRouter = express.Router();

// CORS chỉ bật credentials ở route cần dùng session (reset-password)
const corsWithCredentials = cors({
  origin: "http://localhost:5173", // hoặc domain FE thật sự của bạn
  credentials: true,
});

resetPasswordAdminRouter.post(
  "/forgot-password",
  validateRequest(checkEmployeeCodeSchema),
  checkEmployeeCodeExists
);

resetPasswordAdminRouter.post(
  "/reset-password",
  corsWithCredentials, // Chỉ route này cần session/cookie
  resetPasswordLimiter,
  validateRequest(resetPasswordAdminSchema),
  resetAdminPassword
);

export default resetPasswordAdminRouter;
