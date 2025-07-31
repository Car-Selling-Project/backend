import express from "express";
import { createCar } from "../controllers/Cars.controller.js";
import { authAdmin } from "../middlewares/AuthAdmins.middlewares.js";
import {createCarLimiter} from "../middlewares/CreateCarlimiter.middlewares.js";
import {validateRequest} from "../middlewares/validateRequest.middlewares.js";
import {upload} from "../middlewares/Upload.middlewares.js";
import { createCarSchema } from "../validations/CreateCar.validations.js";
import { handleImageUpload } from "../middlewares/HandleImageUpload.js";
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
export default CRUDCarsRouter;