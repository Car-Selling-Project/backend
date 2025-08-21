import Customer from "../models/customers.schema.js";

// getAllCustomer
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select("_id name"); 
    res.status(200).json(customers); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
