import jwt from "jsonwebtoken";
import Customer from "../models/customers.schema.js";

export const authCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '🚫 No access token provided' });
    }

    const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN); // ✅ đúng với login


    
    const customer = await Customer.findById(decoded.customerId).select('-password');
    if (!customer) {
      return res.status(404).json({ message: '❌ Customer not found' });
    }

    req.customer = customer; 
    next(); 
  } catch (error) {
    return res.status(401).json({ message: '❌ Invalid or expired token' });
  }
};
