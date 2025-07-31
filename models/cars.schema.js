import mongoose from "mongoose";
const CarSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brandId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required:true
    },
    locationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required:true
    },
    model:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    fuelType:{
        type:String,
        enum:["Gasoline", "Diesel", "Electric", "Hybrid"],
        required:true
    },
    tranmission:{
        type:String,
        enum:["Manual", "Automatic"],
        required:true
    },
    seat:{
        type:Number,
        required:true,
        min:2,
        max:20
    },
    carType:{
        type:String,
        enum: ["Sedan", "SUV", "Hatchback", "Pickup", "MPV"],
        required:true
    },
    exteriorColor:{
        type:[String],
        required:true
    },
    registrationYear:{
        type:Number,
        default: new Date().getFullYear(),
        required:true,
        min:1986
    },
    dimension:{
        length:{
            type:Number,
            required:true,
            min:0
        },
        width:{
            type:Number,
            required:true,
            min:0
        },
        height:{
            type:Number,
            required:true,
            min:0
        }
    },
    engine:{
        power:{
            type:String,
            required:true
        },
        fuelconsumsion:{
            type:String,
            required:true
        }
    },
  images: {
  type: [String],
  required: true,
  validate: {
    validator: function (arr) {
      return Array.isArray(arr) && arr.length > 0 && arr.length < 10;
    },
    message: "🚫 Images must contain between 1 and 9 items",
  }
},

    stock:{
        type:Number,
        required:true,
        min:0,
        validate:{
            validator: Number.isInteger,
            message: "🚫 Stock must be an integer"
        }
    },
    viewCount:{
        type:Number,
        default:0,
        min:0,
       set: val => Math.round(val * 10) / 10
    },
     rating:{
        type:Number,
        required:true,
        min:1,
        max:5,
        set:val => Math.round(val * 10) / 10,
        default:5
    },
    status:{
        type:String,
        enum:["active", "inactive"],
        default: "inactive"
    },
    createBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    },
},
{
    timestamps:true
},
);
const Car = mongoose.model("Car" , CarSchema);
export default Car;