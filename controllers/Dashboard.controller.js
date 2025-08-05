import Order from "../models/orders.schema.js";
import Customer from "../models/customers.schema.js";
import  Car from "../models/cars.schema.js";
export const getDashboardStat = async(req , res) => {
    try{
        const [totalOrders , totalCars , totalCustomers] = await Promise.all([
            Order.countDocuments(),
            Customer.countDocuments(),
            Car.countDocuments()
        ]);
        return res.status(200).json({
            totalOrders,
            totalCustomers,
            totalCars,
        })
    }catch(error){
        console.error("❌ Error in getDashboardStats:", error);
         return res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
}