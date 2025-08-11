import express from "express";
import { GetAllBrands } from "../controllers/Brands.controller.js";
const BrandRouter = express.Router();
BrandRouter.get("/brands" ,GetAllBrands);
export default BrandRouter;