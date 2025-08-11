import mongoose from "mongoose";
const testdriveSchema = new mongoose.Schema({
    admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required:true
    },
    carInfo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Car",
        required:true
    },
    location:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required:true
    },
    requestDay:{
        type:Date,
        required:true
    },
    endDay:{
        type:Date,
        required:true
    },
    note:{
        type:String
    },
    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required:true
    },
    customerInfo:{
        fullName:{type: String, required: true},
        phone:{type:String, required:true},
        email:{type:String, required:true},
        citizenId:{type:String , required:true},
        address:{type:String, required:true}
    },
    status:{
        type:String,
        enum:["pending", "approved", "declined"],
        default: "pending"
    },
},
{
    timestamps:true
});
const TestDrive = mongoose.model("TestDrive" , testdriveSchema);
export default TestDrive;