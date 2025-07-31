import mongoose from "mongoose";
const favoriteSchema = new mongoose.Schema({
    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },
    carId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Car",
        required:true
    },
},
{
    timestamps:true
},)
const Favorite = mongoose.model("Favorite" , favoriteSchema);
export default Favorite;