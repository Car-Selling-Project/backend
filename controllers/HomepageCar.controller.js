// controllers/carController.js
import Car from "../models/cars.schema.js";
import Review from "../models/review.schema.js";

export const getPopularCars = async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      { $match: { rating: 5 } },
      { $group: { _id: "$carId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    const carIds = reviews.map(r => r._id);

    const cars = await Car.find({ 
        _id: { $in: carIds },
        status: 'active'
      })
      .select('title brandId locationId')
      .populate([
        { path: 'brandId', select: 'name' },
        { path: 'locationId', select: 'name' }
      ]);

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch popular cars", error: err.message });
  }
};


export const getRecommendedCars = async (req, res) => {
  try {
    // Lấy carId có rating từ 4 đến 5, random 8 cái
    const reviews = await Review.aggregate([
      { $match: { rating: { $gte: 4, $lte: 5 } } },
      { $group: { _id: "$carId" } },
      { $sample: { size: 8 } }
    ]);

    const carIds = reviews.map(r => r._id);

    const cars = await Car.find({
      _id: { $in: carIds },
      status: 'active'
    })
      .select('title brandId locationId')
      .populate([
        { path: 'brandId', select: 'name' },
        { path: 'locationId', select: 'name' }
      ]);

    res.status(200).json({ cars });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch recommended cars",
      error: err.message
    });
  }
};