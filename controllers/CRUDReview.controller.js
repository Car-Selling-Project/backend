import Review from "../models/review.schema.js";

// ✅ Create Review
export const createReview = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { carId, rating, comment } = req.body;
    if (!carId || !rating) {
      return res.status(400).json({ message: "carId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      customerId,
      carId,
      rating,
      comment: comment || "",
    });

    return res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all reviews (with car + brand + customer)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customerId", "name")
      .populate({
        path: "carId",
        select: "images title brandId",
        populate: {
          path: "brandId",
          select: "name",
        },
      });

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Review
export const updateReview = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({ _id: reviewId, customerId });
    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = rating;
    }

    if (comment !== undefined) review.comment = comment;

    await review.save();
    return res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error("❌ Error updating review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Review
export const deleteReview = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({ _id: reviewId, customerId });
    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
