import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./configs/connectdb.js";
import RegisterCustomersRouter from "./routes/RegisterCustomers.routes.js";

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
  })
);

app.use(express.json());
app.use(morgan("dev"));

// 📌 Prefix routes
app.use("/customers", RegisterCustomersRouter);

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
