import mongoose from "mongoose";
const locationSchema = new mongoose.Schema({
    location:{
        type:String,
        required:true,
        unique:true
    }
});
const Location = mongoose.model("Location" , locationSchema);
export default Location;