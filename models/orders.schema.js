import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  carInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: true
  },
  location: {
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
  customerId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Customer',
    required:true
  },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },      
    email: { type: String, required: true },
    citizenId: { type: String, required: true},  
    address: { type: String, required: true }
  },
  contract: {
    contract: {
  url: { type: String },
  signed: { type: Boolean, default: false },
  signerName: { type: String },
  signDate: { type: Date }
}

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
