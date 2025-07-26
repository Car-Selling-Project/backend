import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./configs/connectdb.js";
import RegisterCustomersRouter from "./routes/RegisterCustomers.routes.js";
import LoginCustomersRouter from "./routes/LoginCustomers.routes.js";
import RegisterAdminsRouter from "./routes/RegisterAdmins.routes.js";
import LoginAdminRouter from "./routes/LoginAdmin.routes.js";
import resetPasswordCustomerRouter from "./routes/ResetPasswordCustomer.routes.js";
import resetPasswordAdminRouter from "./routes/ResetPasswordAdmins.routes.js";

dotenv.config(); // Load biến môi trường từ .env

const app = express();

// Kết nối MongoDB
connectDB()
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ⚙️ Cấu hình CORS
const allowedOrigins = [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials:true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// 📌 Prefix routes
//routes customers
app.use("/customers", RegisterCustomersRouter);
app.use("/customers", LoginCustomersRouter);
app.use("/customers", resetPasswordCustomerRouter)



//routes admin
app.use("/admins", RegisterAdminsRouter);
app.use("/admins", LoginAdminRouter);
app.use("/admins", resetPasswordAdminRouter )

// ✅ Export app để test
export default app;

// 🟢 Khởi chạy server nếu chạy trực tiếp (không khi import test)
if (process.env.NODE_ENV !== "test") {
  const server = http.createServer(app);
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}
