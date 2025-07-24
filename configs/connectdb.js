import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load biến môi trường từ .env

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1); // Dừng tiến trình khi lỗi
  }
};

export default connectDB;
