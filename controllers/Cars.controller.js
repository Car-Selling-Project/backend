import Car from "../models/cars.schema.js";
import Car_Engine from "../models/car_engine.schema.js";
import Car_Dimension from "../models/cars.dimention.schema.js";
import Car_Detail from "../models/carsdetail.schema.js";
import Brand from "../models/brands.schema.js";
import Location from "../models/location.schema.js";
import { uploadToCloudinary } from "../configs/cloudinary.config.js";

// Create Car Controller
export const createCar = async (req, res) => {
  try {
    let { car, engine, dimension, detail } = req.body;

    // Parse body nếu là form-data (upload ảnh thì chắc chắn là vậy)
    if (typeof car === "string") car = JSON.parse(car);
    if (typeof engine === "string") engine = JSON.parse(engine);
    if (typeof dimension === "string") dimension = JSON.parse(dimension);
    if (typeof detail === "string") detail = JSON.parse(detail);

    // Kiểm tra brand/location tồn tại
    const brand = await Brand.findById(car.brandId);
    if (!brand)
      return res.status(400).json({ message: "❌ Invalid brandId" });

    const location = await Location.findById(car.locationId);
    if (!location)
      return res.status(400).json({ message: "❌ Invalid locationId" });

    const adminId = req.admin?._id;
    if (!adminId)
      return res
        .status(401)
        .json({ message: "🚫 Unauthorized: Admin not authenticated" });

    // ✅ Upload ảnh lên Cloudinary
    const imageUploadPromises = req.files.map((file) =>
      uploadToCloudinary(file, "cars")
    );
    const imageUrls = await Promise.all(imageUploadPromises);

    // ✅ Tạo Car chính
    const newCar = await Car.create({
      title: car.title,
      description: car.description,
      brandId: car.brandId,
      locationId: car.locationId,
      model: car.model,
      images: imageUrls,
      createdBy: adminId,
      status: "unavailable",
    });

    // ✅ Tạo Engine
    await Car_Engine.create({
      carId: newCar._id,
      ...engine,
    });

    // ✅ Tạo Dimension
    await Car_Dimension.create({
      carId: newCar._id,
      ...dimension,
    });

    // ✅ Tạo Detail
    await Car_Detail.create({
      carId: newCar._id,
      ...detail,
    });

    res.status(201).json({
      message: "✅ Car created successfully",
      carId: newCar._id,
    });
  } catch (error) {
    console.error("❌ Error creating car:", error);
    res
      .status(500)
      .json({ message: "🚫 Internal Server Error", error: error.message });
  }
};
