import express from "express";
import { getAllAdmins } from "../controllers/Orders.controller.js";

const AdminsRouter = express.Router();

// GET /admins
AdminsRouter.get("/", getAllAdmins);
export default AdminsRouter;