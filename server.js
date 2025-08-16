import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import session from "express-session"; 
import connectDB from "./configs/connectdb.js";
import cloudinary from "./configs/cloudinary.config.js";

// ✅ Import route modules
import RegisterCustomersRouter from "./routes/RegisterCustomers.routes.js";
import LoginCustomersRouter from "./routes/LoginCustomers.routes.js";
import RegisterAdminsRouter from "./routes/RegisterAdmins.routes.js";
import LoginAdminRouter from "./routes/LoginAdmin.routes.js";
import resetPasswordCustomerRouter from "./routes/ResetPasswordCustomer.routes.js";
import resetPasswordAdminRouter from "./routes/ResetPasswordAdmins.routes.js";
import CRUDCarsRouter from "./routes/CRUDCar.routes.js";
import HomepageCarRouter from "./routes/Homepage.routes.js";
import FavoritesCarRouter from "./routes/CRUDFavorites.routes.js";
import CarRouter from "./routes/Cars.routes.js";
import CompareCarRouter from "./routes/CompareCars.routes.js";
import DashboardStatRouter from "./routes/DashBoardStat.routes.js";
import OrderRouter from "./routes/Orders.routes.js";
import { AdminContractRouter, CustomerContractRouter } from "./routes/Contracts.routes.js";
import LocationRouter from "./routes/Locations.route.js";
import BrandRouter from "./routes/Brands.routes.js";
import TestDriveRouter from "./routes/TestDrive.routes.js";
import PaymentRouter from "./routes/Payment.routes.js";

// ✅ Load biến môi trường từ .env
dotenv.config();

const app = express();

// ✅ Kết nối MongoDB
connectDB()
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Config CORS
const corsNormal = cors({
  origin: "http://localhost:5173",
});

const corsWithCredentials = cors({
  origin: "http://localhost:5173",
  credentials: true,
});

// ✅ Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 phút
    },
  })
);

// ✅ Middleware cơ bản
app.use(express.json());
app.use(morgan("dev"));

// ================== ROUTES ================== //

// Customers (không credentials)
app.use("/customers", corsNormal, RegisterCustomersRouter);
app.use("/customers", corsNormal, LoginCustomersRouter);
app.use("/customers", corsNormal, HomepageCarRouter);
app.use("/customers", corsNormal, FavoritesCarRouter);
app.use("/customers", corsNormal, CarRouter);
app.use("/customers", corsNormal, CompareCarRouter);
app.use("/customers", corsNormal, LocationRouter);
app.use("/customers", corsNormal, BrandRouter);
app.use("/customers", corsNormal, CustomerContractRouter);
app.use("/customers", corsNormal, TestDriveRouter);
app.use("/customers", corsNormal, OrderRouter);
app.use("/customers", corsNormal, PaymentRouter);

// Customers reset password (có credentials)
app.use("/customers", corsWithCredentials, resetPasswordCustomerRouter);

// Admins (không credentials)
app.use("/admins", corsNormal, RegisterAdminsRouter);
app.use("/admins", corsNormal, LoginAdminRouter);
app.use("/admins", corsNormal, CRUDCarsRouter);
app.use("/admins", corsNormal, DashboardStatRouter);
app.use("/admins", corsNormal, OrderRouter);
app.use("/admins", corsNormal, AdminContractRouter);
app.use("/admins", corsNormal, LocationRouter);
app.use("/admins", corsNormal, BrandRouter);
app.use("/admins", corsNormal, TestDriveRouter);
app.use("/admins", corsNormal, PaymentRouter);

// Admins reset password (có credentials)
app.use("/admins", corsWithCredentials, resetPasswordAdminRouter);

// ✅ Export app để dùng trong test
export default app;

// ✅ Chạy server nếu không phải môi trường test
if (process.env.NODE_ENV !== "test") {
  const server = http.createServer(app);
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}
