// controllers/cars.controller.js

import Car from "../models/cars.schema.js";
import Brand from "../models/brands.schema.js";
import Location from "../models/location.schema.js";
import { uploadToCloudinary } from "../configs/cloudinary.config.js";

/**
 * POST /admin/cars
 * Create new car
 */
export const createCar = async (req, res) => {
  try {
    const {
      title,
      description,
      brandId,
      locationId,
      model,
      price,
      fuelType,
      tranmission,
      seat,
      carType,
      exteriorColor,
      registrationYear,
      dimension,
      engine,
      stock,
      rating,
      viewCount,
      status
    } = req.body;

    // Validate brand
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(400).json({ message: "❌ Invalid brandId" });
    }

    // Validate location
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(400).json({ message: "❌ Invalid locationId" });
    }

    // Validate admin
    const adminId = req.admin?._id;
    if (!adminId) {
      return res
        .status(401)
        .json({ message: "🚫 Unauthorized: Admin not authenticated" });
    }

    // Validate ảnh gửi lên
    if (!req.files || !Array.isArray(req.files)) {
      return res
        .status(400)
        .json({ message: "🚫 Images must be provided as an array" });
    }

    if (req.files.length < 1 || req.files.length > 9) {
      return res
        .status(400)
        .json({ message: "🚫 Images must contain between 1 and 9 items" });
    }

    // Upload lên Cloudinary
  const imageUrls = await Promise.all(
  req.files.map(async (file) => {
    const url = await uploadToCloudinary(file, "cars");
    if (!url) {
      throw new Error("❌ Failed to upload image");
    }
    return url;
  })
);

    // Tạo xe mới
    const newCar = await Car.create({
      title,
      description,
      brandId,
      locationId,
      model,
      price,
      fuelType,
      tranmission,
      seat,
      carType,
      exteriorColor,
      registrationYear,
      dimension,
      engine,
      images: imageUrls,
      stock,
      rating,
      viewCount,
      status,
      createBy: adminId
    });

    return res.status(201).json({
      message: "✅ Car created successfully",
      data: newCar
    });
  } catch (error) {
    console.error("❌ Error creating car:", error);
    return res.status(500).json({
      message: "🚫 Internal Server Error",
      error: error.message
    });
  }
};
