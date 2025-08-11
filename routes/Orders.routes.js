import express from "express";
import {authAdmin} from "../middlewares/AuthAdmins.middlewares.js";
import {validateRequest} from "../middlewares/validateRequest.middlewares.js";
import orderValidationSchema from "../validations/Orders.validations.js";
import updateOrderValidationSchema from "../validations/UpdateOrder.validations.js";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderById,
    deleteOrderById,
    confirmOrder,
    canceledOrder
} from "../controllers/Orders.controller.js";
const OrderRouter = express.Router();
OrderRouter.post("/orders" , authAdmin , validateRequest(orderValidationSchema) , createOrder);
OrderRouter.get("/orders" , authAdmin , getAllOrders);
OrderRouter.get("/orders/:id" , authAdmin , getOrderById);
OrderRouter.patch("/orders/:id", authAdmin , validateRequest(updateOrderValidationSchema), updateOrderById);
OrderRouter.delete("/delete/:id", authAdmin, deleteOrderById);
OrderRouter.patch("/orders/:id/confirm" , authAdmin , confirmOrder);
OrderRouter.patch("/orders/:id/canceled", authAdmin , canceledOrder);
export default OrderRouter;
