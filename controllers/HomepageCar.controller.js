import Car from "../models/cars.schema.js";
export const getHomepageCars = async (req , res) => {
    try{
        const popularCars = await Car.find({status: 'available'})
        .sort({reviewCount: -1 , averageRating : -1})
        .limit(5)
        .populate("brandId locationId");
        const recommendedCars = await Car.aggregate([
            {$match: {
                       status: "available",
                       averageRating: {$gte:4 , $ste:5}
                    }
            },
            {
                $sample:{size:5}
            }
        ]);
        res.status(200).json({
            popularCars,
            recommendedCars,
        });
    }catch(err){
        res.status(500).json({
            message: "Error fetching homepage cars",
            error: err.message,
        })
    }
}