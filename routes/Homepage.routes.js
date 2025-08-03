import express from "express";
import { getPopularCars, getRecommendedCars } from "../controllers/HomepageCar.controller.js";
const HomepageCarRouter = express.Router();
HomepageCarRouter.get("/popularcars", getPopularCars);
HomepageCarRouter.get("/recommendcars" , getRecommendedCars)
export default HomepageCarRouter;