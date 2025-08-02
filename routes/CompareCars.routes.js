import express from "express";
import { compareCarSchema } from "../validations/CompareCar.validations.js";
import { validateRequest } from "../middlewares/validateRequest.middlewares.js";
import { compareCars } from "../controllers/CompareCar.controller.js";
const CompareCarRouter = express.Router();
CompareCarRouter.post("/cars/compare" , validateRequest(compareCarSchema) , compareCars);
export default CompareCarRouter;