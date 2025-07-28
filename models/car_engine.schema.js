import mongoose from "mongoose";
const carEngineSchema = new mongoose.Schema({
    carId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Car",
        required:true,
        unique:true
    },
    fuelType:{
        type:String,
        required:true
    },
    gasoline:{
        type:String,
        required:true
    },
    steering:{
        type:String,
        required:true
    },
    power:{
        type:String,
        required:true
    },
});
const Car_Engine = mongoose.model("Car_Engine", carEngineSchema);
export default Car_Engine;