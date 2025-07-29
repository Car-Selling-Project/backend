import jwt from "jsonwebtoken";
import Admin from "../models/admins.schema.js";

export const authAdmin = async(req , res , next) => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: '🚫 No access token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN); // ✅ đúng với login


        const admin = await Admin.findById(decoded.adminId).select('-password');
        if(!admin) return res.status(404).json({message: '❌ Admin not found'});

        req.admin = admin;
        next();

    }catch(error){
        return res.status(401).json({ message: '❌ Invalid or expired token' });
    }
};