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
// GET /cars
export const getAllCars = async (req, res) => {
  try {
    const {
      brandIds,
      locationIds,
      fuelTypes,
      tranmissions,
      seat,
      carTypes,
      exteriorColors,
      registrationYears,
      status,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      minViewCount,
      maxViewCount,
      "engine.power": enginePower,
      "engine.fuelconsumsion": fuelConsumsion,
      "dimension.length": dimensionLength,
      "dimension.width": dimensionWidth,
      "dimension.height": dimensionHeight,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (brandIds) query.brandId = { $in: brandIds.split(",") };
    if (locationIds) query.locationId = { $in: locationIds.split(",") };
    if (fuelTypes) query.fuelType = { $in: fuelTypes.split(",") };
    if (tranmissions) query.tranmission = { $in: tranmissions.split(",") };
    if (seat) query.seat = { $in: seat.split(",").map(Number) };
    if (carTypes) query.carType = { $in: carTypes.split(",") };
    if (exteriorColors) query.exteriorColor = { $in: exteriorColors.split(",") };
    if (registrationYears) query.registrationYear = { $in: registrationYears.split(",").map(Number) };
    if (status) query.status = { $in: status.split(",") };

    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);

    if (minRating || maxRating) query.rating = {};
    if (minRating) query.rating.$gte = Number(minRating);
    if (maxRating) query.rating.$lte = Number(maxRating);

    if (minViewCount || maxViewCount) query.viewCount = {};
    if (minViewCount) query.viewCount.$gte = Number(minViewCount);
    if (maxViewCount) query.viewCount.$lte = Number(maxViewCount);

    // Nested engine & dimension fields
    if (enginePower) query["engine.power"] = Number(enginePower);
    if (fuelConsumsion) query["engine.fuelconsumsion"] = Number(fuelConsumsion);
    if (dimensionLength) query["dimension.length"] = Number(dimensionLength);
    if (dimensionWidth) query["dimension.width"] = Number(dimensionWidth);
    if (dimensionHeight) query["dimension.height"] = Number(dimensionHeight);

    const skip = (Number(page) - 1) * Number(limit);

  const [cars, total] = await Promise.all([
  Car.find(query)
    .skip(skip)
    .limit(Number(limit))
    .populate("brandId", "name")        // chỉ lấy trường `name` từ Brand
    .populate("locationId", "name"),    // chỉ lấy trường `location` từ Location
  Car.countDocuments(query),
]);

    res.status(200).json({
      message: "✅ Get cars successfully",
      total,
      page: Number(page),
      limit: Number(limit),
      cars,
    });
  } catch (error) {
    res.status(500).json({
      message: "🚫 Failed to get cars",
      error: error.message,
    });
  }
};
// PATCH /cars/:id
export const updateCarById = async (req, res) => {
  try {
    const { id } = req.params;

    // Clone req.body và loại bỏ field `images` nếu có
    const updateFields = { ...req.body };
    delete updateFields.images;

    let combinedImages = [];

    // Nếu có file ảnh mới thì xử lý upload
    if (req.files && req.files.length > 0) {
      const newImageUrls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "cars"))
      );

      const car = await Car.findById(id);
      if (!car) {
        return res.status(404).json({ message: "🚫 Car not found" });
      }

      // Gộp ảnh cũ và ảnh mới
      combinedImages = [...car.images, ...newImageUrls];

      // Check tổng ảnh phải từ 1 đến 9
      if (combinedImages.length < 1 || combinedImages.length > 9) {
        return res.status(400).json({
          message: "🚫 Total images must be between 1 and 9",
        });
      }

      updateFields.images = combinedImages;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedCar) {
      return res.status(404).json({ message: "🚫 Car not found" });
    }

    const populatedCar = await Car.findById(id)
  .populate("brandId", "name")
  .populate("locationId", "name");

res.status(200).json({
  message: "✅ Car updated successfully",
  car: populatedCar,
});

  } catch (error) {
    res.status(500).json({
      message: "🚫 Failed to update car",
      error: error.message,
    });
  }
};
export const getCarById = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id)
  .populate("brandId", "name")
  .populate("locationId", "name");


    if (!car) {
      return res.status(404).json({
        message: "🚫 Car not found",
      });
    }

    res.status(200).json({
      message: "✅ Get car successfully",
      car,
    });
  } catch (error) {
    res.status(500).json({
      message: "🚫 Failed to get car",
      error: error.message,
    });
  }
};