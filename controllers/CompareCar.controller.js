import mongoose from "mongoose";
import Car from "../models/cars.schema.js";

export const compareCars = async (req, res) => {
  try {
    const { carIds } = req.body;

    // Validate: phải là array 2-3 phần tử
    if (!Array.isArray(carIds) || carIds.length < 2 || carIds.length > 3) {
      return res.status(400).json({
        message: "🚫 You must provide 2 or 3 carIds for comparison.",
      });
    }

    // Validate từng phần tử là ObjectId hợp lệ
    const invalidIds = carIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "🚫 Invalid carId(s) detected.",
        invalidIds,
      });
    }

    // Truy vấn DB
    const cars = await Car.find({ _id: { $in: carIds } })
      .select(
        "title brandId model price registrationYear engine seat fuelType carType tranmission exteriorColor images"
      )
      .populate("brandId", "name")
      .lean();

    // Kiểm tra đủ số lượng
    if (cars.length !== carIds.length) {
      const foundIds = cars.map((c) => c._id.toString());
      const notFound = carIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        message: "🚫 One or more cars not found.",
        notFound,
      });
    }

    return res.status(200).json({
      message: "✅ Cars comparison data",
      data: cars,
    });
  } catch (error) {
    return res.status(500).json({
      message: "🚫 Internal server error",
      error: error.message,
    });
  }
};
