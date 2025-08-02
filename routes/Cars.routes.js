// routes/CarRouter.js
import express from "express";
import { getCarById, getAllCars } from "../controllers/Cars.controller.js";
const CarRouter = express.Router();

CarRouter.get("/cars", getAllCars);          // GET /cars
CarRouter.get("/cars/:id", getCarById);       // GET /cars/:id

export default CarRouter;
