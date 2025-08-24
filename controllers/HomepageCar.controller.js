// controllers/carController.js
import Car from "../models/cars.schema.js";
import Review from "../models/review.schema.js";

export const getPopularCars = async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      { $match: { rating: 5 } },
      { $group: { _id: "$carId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const carIds = reviews.map(r => r._id);

    let cars = await Car.find({ 
        _id: { $in: carIds },
        status: 'active'
      })
      .populate([
        { path: 'brandId', select: 'name' },
        { path: 'locationId', select: 'name' }
      ]);

    // chỉ lấy đúng 4 xe
    cars = cars.slice(0, 4);

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch popular cars", error: err.message });
  }
};


export const getRecommendedCars = async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      { $match: { rating: { $gte: 4, $lte: 5 } } },
      { $group: { _id: "$carId" } },
      { $sample: { size: 20 } } // lấy nhiều hơn 8 để còn lọc active
    ]);

    const carIds = reviews.map(r => r._id);

    let cars = await Car.find({
      _id: { $in: carIds },
      status: 'active'
    })
      .populate([
        { path: 'brandId', select: 'name' },
        { path: 'locationId', select: 'name' }
      ]);

    // chỉ lấy đúng 8 xe
    cars = cars.slice(0, 8);

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch recommended cars",
      error: err.message
    });
  }
};
