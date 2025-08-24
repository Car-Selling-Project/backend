import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import session from "express-session"; // ✅ Thêm session
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
import HomepageCarRouter from "./routes/Homepage.routes.js"
import FavoritesCarRouter from "./routes/CRUDFavorites.routes.js";
import CarRouter from "./routes/Cars.routes.js";
import CompareCarRouter from "./routes/CompareCars.routes.js";
import DashboardStatRouter from "./routes/DashBoardStat.routes.js";
import OrderRouter from "./routes/Orders.routes.js";
import { AdminContractRouter, CustomerContractRouter } from "./routes/Contracts.routes.js";
import LocationRouter from "./routes/Locations.route.js";
import BrandRouter from "./routes/Brands.routes.js";
import TestDriveRouter from "./routes/TestDrive.routes.js";
import  PaymentRouter from "./routes/Payment.routes.js";
import ReviewsRouter from "./routes/Reviews.routes.js";
import AdminsRouter from "./routes/Admin.routes.js";
import getAllCustomerRouter from "./routes/Customer.routes.js";
import ProfileRouter from "./routes/ProfileCustomer.routes.js";
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
// ✅ Cấu hình CORS
const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST" , "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true nếu dùng HTTPS
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 phút
    },
  })
);
app.use(cors(corsOptions));

// ✅ Middleware cơ bản
app.use(express.json());
app.use(morgan("dev"));


// ✅ Prefix routes

// Customers
app.use("/customers", RegisterCustomersRouter);
app.use("/customers", LoginCustomersRouter);
app.use("/customers", resetPasswordCustomerRouter);
app.use("/customers", HomepageCarRouter);
app.use("/customers", FavoritesCarRouter);
app.use("/customers", CarRouter);
app.use("/customers" , CompareCarRouter);
app.use("/customers", LocationRouter);
app.use("/customers" , BrandRouter);
app.use("/customers", CustomerContractRouter);
app.use("/customers", TestDriveRouter);
app.use("/customers", OrderRouter);
app.use("/customers", PaymentRouter);
app.use("/customers", ReviewsRouter);
app.use("/customers" , AdminsRouter);
app.use("/customers", ProfileRouter);


// Admins
app.use("/admins", RegisterAdminsRouter);
app.use("/admins", LoginAdminRouter);
app.use("/admins", resetPasswordAdminRouter);
app.use("/admins" , CRUDCarsRouter);
app.use("/admins" , DashboardStatRouter);
app.use("/admins", OrderRouter);
app.use("/admins" , AdminContractRouter);
app.use("/admins", LocationRouter);
app.use("/admins", BrandRouter);
app.use("/admins", TestDriveRouter);
app.use("/admins", PaymentRouter);
app.use("/admins" , getAllCustomerRouter);
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
