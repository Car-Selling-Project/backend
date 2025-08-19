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

    const populatedReview = await Review.findById(review._id)
      .populate("customerId", "name")
      .populate({
        path: "carId",
        select: "title brandId images",
        populate: { path: "brandId", select: "name" },
      });

    return res.status(201).json({
      message: "Review created successfully",
      review: {
        _id: populatedReview._id,
        rating: populatedReview.rating,
        comment: populatedReview.comment,
        customer: { name: populatedReview.customerId.name },
        car: {
          name: populatedReview.carId.title,
          images: populatedReview.carId.images,
          brand: populatedReview.carId.brandId?.name || null,
        },
        date: populatedReview.createdAt.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all reviews
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
      customer: { name: r.customerId.name },
      car: {
        name: r.carId.title,
        images: r.carId.images,
        brand: r.carId.brandId?.name || null,
      },
      date: r.createdAt.toISOString().split("T")[0],
    }));

    return res.status(200).json({ reviews: formattedReviews });
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

    const review = await Review.findOne({ _id: reviewId, customerId })
      .populate("customerId", "name")
      .populate({
        path: "carId",
        select: "title brandId images",
        populate: { path: "brandId", select: "name" },
      });

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

    return res.status(200).json({
      message: "Review updated successfully",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        customer: { name: review.customerId.name },
        car: {
          name: review.carId.title,
          images: review.carId.images,
          brand: review.carId.brandId?.name || null,
        },
        date: review.createdAt.toISOString().split("T")[0],
      },
    });
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

    const review = await Review.findOneAndDelete({ _id: reviewId, customerId })
      .populate("customerId", "name")
      .populate({
        path: "carId",
        select: "title brandId images",
        populate: { path: "brandId", select: "name" },
      });

    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Review deleted successfully",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        customer: { name: review.customerId.name },
        car: {
          name: review.carId.title,
          images: review.carId.images,
          brand: review.carId.brandId?.name || null,
        },
        date: review.createdAt.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
