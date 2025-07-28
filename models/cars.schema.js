import mongoose from "mongoose";
const carSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    brandId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required:true
    },
    locationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Location"
    },
    model:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:["unavailable", "available", "sold"],
        default:"unavailable"
    },
    images:{
        type:[String],
        default:[],
        required:true
    },
    averageRating:{
        type:Number,
        min:0,
        max:5,
        set: (val) => Math.round(val*10)/10,
        default:0
    },
    reviewCount:{
        type: Number,
        default:0,
        min:0,
        validate:{
            validator: Number.isInteger,
            message:"reviewCount must be an integer"
        },
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    },
},
{
    timestamps:true
},
);
const Car = mongoose.model("Car" , carSchema);
export default Car;