import express from "express";
import { createReview , getAllReviews , updateReview , deleteReview } from "../controllers/CRUDReview.controller.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
const ReviewsRouter = express.Router();
ReviewsRouter.post("/reviews" ,authCustomer , createReview);
ReviewsRouter.get("/reviews", getAllReviews);
ReviewsRouter.patch("/reviews/:reviewId", authCustomer, updateReview);
ReviewsRouter.delete("/reviews/:reviewId", authCustomer, deleteReview);
export default ReviewsRouter;