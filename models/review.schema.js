import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  customerId: {  // người đánh giá chính
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  carId: {  // xe được đánh giá
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true
  },
  rating: {  // điểm đánh giá (1-5)
    type: Number,
    required: true,
    min: 1,
    max: 5,
    set: val => Math.round(val * 10) / 10
  },
  comment: {  // bình luận của khách
    type: String,
    default: ""
  }
}, {
  timestamps: true
});



const Review = mongoose.model("Review", reviewSchema);

export default Review;