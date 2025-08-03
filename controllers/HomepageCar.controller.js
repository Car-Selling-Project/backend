import Car from "../models/cars.schema.js";

export const getHomepageCars = async (req, res) => {
  try {
    const popularCars = await Car.find({ 
  status: "active", 
  rating: 5 
})
.sort({ viewCount: -1 }) 
.limit(4)
.populate("brandId", "name")
.populate("locationId", "name");


    const recommendedCars = await Car.aggregate([
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

    res.status(200).json({
      popularCars,
      recommendedCars,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching homepage cars",
      error: err.message,
    });
  }
};
