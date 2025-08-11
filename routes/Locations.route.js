import express from "express";
import { GetAllLocations } from "../controllers/Location.controller.js";
const LocationRouter= express.Router();
LocationRouter.get("/locations"  , GetAllLocations);
export default LocationRouter;