import express from "express";
import {authAdmin} from "../middlewares/AuthAdmins.middlewares.js";
import { getDashboardStat } from "../controllers/Dashboard.controller.js";
const DashboardStatRouter = express.Router();
DashboardStatRouter.get("/dashboard-stat" , authAdmin ,getDashboardStat);
export default DashboardStatRouter;