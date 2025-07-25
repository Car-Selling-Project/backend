import express from "express";
import { loginRateLimiter } from "../middlewares/LoginRateLimitter.middlewares.js";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import  loginAdminSchema  from "../validations/AdminsLogin.validations.js";
import { loginAdmin } from "../controllers/LoginAdmins.controller.js";

const LoginAdminRouter = express.Router();

LoginAdminRouter.post(
  "/login",
  loginRateLimiter,
  validateRequest(loginAdminSchema),
  loginAdmin
);
export default LoginAdminRouter
