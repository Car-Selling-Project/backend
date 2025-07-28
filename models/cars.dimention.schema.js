import mongoose from "mongoose";
const carDimension = new mongoose.Schema({
    carId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required:true,
        unique:true
    },
    length:{
        type:Number,
        required:true,
        min: 2800,
        max: 5500
    },
    width:{
        type: Number,
        required:true,
        min:1400,
        max:2200
    },
    height:{
        type: Number,
        required:true,
        min: 1200,
        max:2100
    },
    cargoCapacity:{
        type:Number,
        required:true,
        min:100,
        max:2500
    },
});
const Car_Dimension = mongoose.model("Car_Dimension" , carDimension);
export default Car_Dimension