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
    confirmOrder,
    canceledOrder,
    getAllOrderStatusConfirm,
    getAllOrderStatus,
    getOrderByIdForCustomer,
    updatePaymentMethodForCustomer,
    updateDepositForCustomer,
    createCustomerOrder,
    getAllOrdersForCustomer,
} from "../controllers/Orders.controller.js";
import {authCustomer} from "../middlewares/AuthCustomers.middlewares.js";
const OrderRouter = express.Router();
// ---- ADMIN ----
OrderRouter.post("/orders", authAdmin, validateRequest(orderValidationSchema), createOrder);
OrderRouter.get("/orders", authAdmin, getAllOrders);
OrderRouter.get("/orders/:id", authAdmin, getOrderById);
OrderRouter.patch("/orders/:id", authAdmin, validateRequest(updateOrderValidationSchema), updateOrderById);
OrderRouter.patch("/orders/:orderId/confirm", authAdmin, confirmOrder);
OrderRouter.patch("/orders/:id/canceled", authAdmin, canceledOrder);

// ---- CUSTOMER ----
OrderRouter.post("/orders/customers-create", authCustomer, createCustomerOrder);
OrderRouter.get("/orders/confirm", authCustomer, getAllOrderStatusConfirm);
OrderRouter.get("/orders", authCustomer, getAllOrderStatus);
OrderRouter.get("/orders/:id", authCustomer, getOrderByIdForCustomer);
OrderRouter.patch("/orders/:id/paymentmethod", authCustomer, updatePaymentMethodForCustomer);
OrderRouter.patch("/orders/:id/deposit", authCustomer, updateDepositForCustomer);
OrderRouter.get("/orders" , authCustomer, getAllOrdersForCustomer);
export default OrderRouter;
