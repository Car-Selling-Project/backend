import express from "express";
import { GetAllBrands } from "../controllers/Brands.controller.js";
const BrandRouter = express.Router();
BrandRouter.gêt("/brands" ,GetAllBrands);
export default BrandRouter;