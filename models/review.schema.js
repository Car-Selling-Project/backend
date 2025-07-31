import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
    customersId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },
    carId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Car",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5,
        set:val => Math.round(val * 10) / 10
    },
    comment:{
        type:String,
    },
    commentCount:{
        type:Number,
        min:0,
        validate:{
            validator: Number.isInteger,
            message: "commentCount must be integer"
        },
        default:0
    }
},
{
    timestamps:true
}
);
const Review = mongoose.model("Review" , reviewSchema);
export default Review;