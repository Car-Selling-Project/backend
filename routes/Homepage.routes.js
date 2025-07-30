import express from "express";
import { getHomepageCars } from "../controllers/HomepageCar.controller.js";
const HomepageCarRouter = express.Router();
HomepageCarRouter.get("/homepage", getHomepageCars);
export default HomepageCarRouter;