import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0,
    validate:{
        validator: Number.isInteger,
        message: "🚫 deposit must be an integer"
    }
  },
  paymentMethod:{
    type:String,
    enum:["cash", "bank_transfer", "loan"],
    default: "cash"
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "🚫 totalPrice must be an integer"
    }
  },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },      
    email: { type: String, required: true },
    citizenId: { type: String, required: true},  
    address: { type: String, required: true }
  },
  contract: {
    url: { type: String },
    signed: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "canceled"],
    default: "pending"
  }
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
