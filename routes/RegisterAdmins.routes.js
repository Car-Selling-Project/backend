import express from 'express';
import { createAdmin } from '../controllers/RegisterAdmins.controller.js';
import { validateRequest } from '../middlewares/validateRequest.middlewares.js';
import { registerRateLimiter } from '../middlewares/RegisterRateLimitter.middlewares.js';
import { adminSchema } from '../validations/Admins.validations.js';
const RegisterAdminsRouter = express.Router();
RegisterAdminsRouter.post("/register", registerRateLimiter , validateRequest(adminSchema) ,createAdmin );
export default RegisterAdminsRouter;