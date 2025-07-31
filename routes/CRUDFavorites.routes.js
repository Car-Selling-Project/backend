import express from "express";
import {createFavorite,
  getFavorites,
  deleteFavorite,
  checkFavorite,
  deleteAllFavorites, 
} from "../controllers/CRUDfavorites.controller.js";
import { authCustomer } from "../middlewares/AuthCustomers.middlewares.js";
const FavoritesCarRouter = express.Router();
FavoritesCarRouter.post("/favourites", authCustomer , createFavorite );
FavoritesCarRouter.get("/favourites",authCustomer, getFavorites);
FavoritesCarRouter.get("/favourites/:carId",authCustomer, checkFavorite);
FavoritesCarRouter.delete('/favourites/:carId',authCustomer, deleteFavorite);
FavoritesCarRouter.delete("/favourites",authCustomer, deleteAllFavorites);
export default FavoritesCarRouter;