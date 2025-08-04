import Car from "../models/cars.schema.js";

// Sửa controller để nhận (req, res)
export const getPopularCars = async (req, res) => {
  try {
    const cars = await Car.find({ 
      status: "active", 
      rating: 5 
    })
    .sort({ viewCount: -1 }) 
    .limit(4)
    .populate("brandId", "name")
    .populate("locationId", "name");

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch popular cars", error: err.message });
  }
};

export const getRecommendedCars = async (req, res) => {
  try {
    const cars = await Car.aggregate([
      {
        $match: {
          status: "active",
          rating: { $gte: 4, $lte: 5 },
        },
      },
      {
        $sample: { size: 8 },
      },
    ]);

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommended cars", error: err.message });
  }
};