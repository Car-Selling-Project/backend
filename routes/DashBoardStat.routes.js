import express from "express";
import {authAdmin} from "../middlewares/AuthAdmins.middlewares.js";
import { getOrdersWithRevenue, getSoldCars, getTopSalesAdmins } from "../controllers/Dashboard.controller.js";
const DashboardStatRouter = express.Router();
DashboardStatRouter.get("/dashboard-stat/revenue" , authAdmin ,getOrdersWithRevenue);
DashboardStatRouter.get("/dashboard-stat/sold-cars" , authAdmin , getSoldCars);
DashboardStatRouter.get("/dashboard-stat/top-sales" , authAdmin , getTopSalesAdmins)
export default DashboardStatRouter;