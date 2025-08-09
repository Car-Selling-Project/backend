import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  customerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Customer",
    required:true
  },

  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    citizenId: { type: String, required: true },
    address: { type: String, required: true }
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "🚫 amount must be an integer"
    }
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank_transfer", "loan"],
    required: true,
    default: "cash"
  },
  type: {
    type: String,
    enum: ["deposit", "full_payment"],
    required: true,
    default: "full_payment"
  },
  transactionCode: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "pending"
  },
  receiptUrl: {
    type: String,
    default: ""
  },
  confirmBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
