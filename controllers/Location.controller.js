import Location from "../models/location.schema.js";
export const GetAllLocations = async(req , res) => {
    try{
        const locations = await Location.find().sort({name: 1});
        res.status(201).json(locations);
    }catch(err){
        res.status(500).json({message: err.message});
    }
}