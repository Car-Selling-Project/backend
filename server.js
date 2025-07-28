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
  credentials: true,
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
app.use(cors());

// ✅ Middleware cơ bản
app.use(express.json());
app.use(morgan("dev"));


// ✅ Prefix routes

// Customers
app.use("/customers", RegisterCustomersRouter);
app.use("/customers", LoginCustomersRouter);
app.use("/customers", resetPasswordCustomerRouter);

// Admins
app.use("/admins", RegisterAdminsRouter);
app.use("/admins", LoginAdminRouter);
app.use("/admins", resetPasswordAdminRouter);

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
