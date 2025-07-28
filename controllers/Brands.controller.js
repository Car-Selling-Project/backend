import Brand from "../models/brands.schema.js";
// Create Brands
export const createBrand = async (req , res) => {
    try{
        const {name} = req.body;
        const exists = await Brand.findOne({name});
        if(exists) return res.status(400).json({ message: "Brand already exists" });
        const brand = await Brand.create({name});
        res.status(201).json(brand)
    }catch(err){
        res.status(500).json({ message: err.message });
    }
};
// Get Brands
export const GetAllBrands = async(req , res) => {
    try{
        const brands = await Brand.find().sort({name: 1});
        res.status(201).json(brands);
    }catch{
        res.status(500).json({ message: err.message });
    }
}