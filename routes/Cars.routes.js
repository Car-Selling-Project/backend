// routes/CarRouter.js
import express from "express";
import { getCarById, getAllCars , getActiveCars  } from "../controllers/Cars.controller.js";
const CarRouter = express.Router();

CarRouter.get("/cars", getAllCars);          // GET /cars
CarRouter.get("/cars/:id", getCarById);       // GET /cars/:id
CarRouter.get("/cars/active", getActiveCars); // GET /cars/active

export default CarRouter;
