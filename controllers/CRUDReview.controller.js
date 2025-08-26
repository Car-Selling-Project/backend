// controllers/review.controller.js
import Review from "../models/review.schema.js";
import Car from "../models/cars.schema.js";

/**
 * ✅ Create new review
 */
export const createReview = async (req, res) => {
  try {
    const { carId, rating, comment } = req.body;
    const customerId = req.customer._id; // lấy từ token

    if (!carId || !rating) {
      return res.status(400).json({ message: "Car ID and rating are required" });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const review = new Review({
      customerId,
      carId,
      rating,
      comment,
    });
    await review.save();

    return res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ Get all reviews
 */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customerId", "name")
      .populate({
        path: "carId",
        select: "title brandId images",
        populate: { path: "brandId", select: "name" },
      });

    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      customer: { name: r.customerId?.name || "Unknown" },
      car: r.carId
        ? {
            name: r.carId.title,
            images: r.carId.images,
            brand: r.carId.brandId?.name || null,
          }
        : null,
      date: r.createdAt ? r.createdAt.toISOString().split("T")[0] : null,
    }));

    return res.status(200).json({ reviews: formattedReviews });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ Get reviews by car
 */
export const getReviewsByCar = async (req, res) => {
  try {
    const { carId } = req.params;
    const reviews = await Review.find({ carId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      customer: { name: r.customerId?.name || "Unknown" },
      date: r.createdAt ? r.createdAt.toISOString().split("T")[0] : null,
    }));

    return res.status(200).json({ reviews: formattedReviews });
  } catch (error) {
    console.error("❌ Error fetching reviews by car:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ Update review
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.customerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    await review.save();

    return res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error("❌ Error updating review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ Delete review
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.customerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
