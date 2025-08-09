import express from "express";
import {authAdmin} from "../middlewares/AuthAdmins.middlewares.js";
import {getPurchaseDashboard } from "../controllers/Dashboard.controller.js";
const DashboardStatRouter = express.Router();
DashboardStatRouter.get("/dashboard-stat/purchase" , authAdmin ,getPurchaseDashboard);
export default DashboardStatRouter;