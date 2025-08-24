import Customer from '../models/customers.schema.js';
// get Profile Customer
export const getProfileCustomer = async (req , res) => {
    try{
        const customer = req.customer._id;
        if (!customer){
            return res.status(404).json({ message: 'Customer not found' });
        }
        const profileCustomer = await Customer.findById(customer).select('-password');
        if(!profileCustomer) return res.status(404).json({ message: 'Customer not found' });
        return res.status(200).json({ profileCustomer });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}
// Update Profile Customer
export const updateProfileCustomer = async (req , res) => {
    try{
        const customer = req.customer._id;
        if(!customer){
            return res.status(404).json({ message: 'Customer not found' });
        }
        const updatedCustomer = await Customer.findByIdAndUpdate(customer, req.body, { new: true });
        if(!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
        return res.status(200).json({ updatedCustomer });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}