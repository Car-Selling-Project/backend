import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./configs/connectdb.js";
import RegisterCustomersRouter from "./routes/RegisterCustomers.routes.js";

dotenv.config(); // Load biến môi trường từ .env

const app = express();
const server = http.createServer(app);

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
  // "https://binance3.onrender.com"
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

// Middleware
app.use(express.json());
app.use(morgan("dev"));
// Routes
app.use("/customers", RegisterCustomersRouter);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default server;
