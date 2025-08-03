import express from "express";
import { createCar ,deleteCarByid,getAllCars,getCarById,updateCarById } from "../controllers/Cars.controller.js";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import {createCarLimiter} from "../middlewares/CreateCarlimiter.middlewares.js";
import {validateRequest} from "../middlewares/validateRequest.middlewares.js";
import {upload} from "../middlewares/Upload.middlewares.js";
import { createCarSchema } from "../validations/CreateCar.validations.js";
import { handleImageUpload } from "../middlewares/HandleImageUpload.js";
import { updateCarSchema } from "../validations/UpdateCar.validations.js";
const CRUDCarsRouter= express.Router();
CRUDCarsRouter.post(
  "/cars",
  authAdmin,
  createCarLimiter,
  upload.array("images", 10),
  handleImageUpload, // xử lý và biến `req.body.images = [url1, url2, ...]`
  validateRequest(createCarSchema),
  createCar
);
CRUDCarsRouter.get("/cars", getAllCars );
CRUDCarsRouter.patch("/cars/:id", authAdmin, upload.array("images", 10) , handleImageUpload, validateRequest(updateCarSchema) , updateCarById);
CRUDCarsRouter.get("/cars/:id" , getCarById);
CRUDCarsRouter.delete("/cars/:id", deleteCarByid)
export default CRUDCarsRouter;