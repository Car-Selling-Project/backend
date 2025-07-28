import mongoose from "mongoose";
const carDetailSchema = new mongoose.Schema({
    carId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Car",
        required: true,
        unique:true
    },
    registrationYear:{
        type:Number,
        required:true,
        min: 1986,
        max: new Date().getFullYear()
    },
    type:{
        type:String,
        enum:["SUV", "Electric SUV", "Sedan", "Coupe"],
        required:true
    },
    seat:{
        type:Number,
        required:true,
        min:2,
        max:20,
        validate:{
            validator: Number.isInteger,
            message: "Seat must be an integer"
        }
    },
    exteriorColor:{
        type:String,
        required:true
    },
});
const Car_Detail = mongoose.model("Car_Detail"  , carDetailSchema);
export default Car_Detail;