import Car from "../models/cars.schema.js";

export const getPopularCars = async () => {
  return await Car.find({ 
    status: "active", 
    rating: 5 
  })
  .sort({ viewCount: -1 }) 
  .limit(4)
  .populate("brandId", "name")
  .populate("locationId", "name");
};
export const getRecommendedCars = async () => {
  return await Car.aggregate([
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
};
