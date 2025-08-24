import express from "express";
import { getProfileCustomer , updateProfileCustomer } from "../controllers/ProfileCustomer.controller.js";
import {validateRequest} from "../middlewares/validateRequest.middlewares.js";
import {profileSchema}from"../validations/ProfileCustomer.validations.js";
import {authCustomer} from "../middlewares/AuthCustomers.middlewares.js";
const ProfileRouter = express.Router();
ProfileRouter.get("/" , authCustomer , getProfileCustomer);
ProfileRouter.patch("/" , authCustomer , validateRequest(profileSchema) , updateProfileCustomer);
export default ProfileRouter;