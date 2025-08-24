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
    cancelOrder,
    getAllOrderStatusConfirm,
    getAllOrderStatus,
    getOrderByIdForCustomer,
    updatePaymentMethodForCustomer,
    updateDepositForCustomer,
    createCustomerOrder,
    getAllOrdersForCustomer,
    getOrdersForCustomer,
    getAllOrderStatusForCustomer
} from "../controllers/Orders.controller.js";
import {authCustomer} from "../middlewares/AuthCustomers.middlewares.js";
const OrderRouter = express.Router();
// ---- ADMIN ----
OrderRouter.post("/orders", authAdmin, validateRequest(orderValidationSchema), createOrder);
OrderRouter.get("/orders", authAdmin, getAllOrders);
OrderRouter.get("/orders/:id", authAdmin, getOrderById);
OrderRouter.patch("/orders/:id", authAdmin, validateRequest(updateOrderValidationSchema), updateOrderById);
OrderRouter.patch("/orders/:orderId/confirm", authAdmin, confirmOrder);
OrderRouter.patch("/orders/:id/canceled", authAdmin, cancelOrder);

// ---- CUSTOMER ----
OrderRouter.post("/orderss/customers-create", authCustomer, createCustomerOrder);
OrderRouter.get("/orderss/confirm", authCustomer, getAllOrderStatusConfirm);
OrderRouter.get("/orderss", authCustomer, getOrdersForCustomer);
OrderRouter.get("/orderss-status", authCustomer, getAllOrderStatus);
OrderRouter.get("/orderss/:id", authCustomer, getOrderByIdForCustomer);
OrderRouter.patch("/orderss/:id/paymentmethod", authCustomer, updatePaymentMethodForCustomer);
OrderRouter.patch("/orderss/:id/deposit", authCustomer, updateDepositForCustomer);
OrderRouter.get("/orderss/allorderforcustomer", authCustomer, getAllOrdersForCustomer);
OrderRouter.get("/orderss/status", authCustomer, getAllOrderStatusForCustomer);

export default OrderRouter;
