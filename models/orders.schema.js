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
    validate: {
      validator: function (value) {
        if (!this.totalPrice) return true;
        return value === this.totalPrice || (value >= 0.3 * this.totalPrice && value < this.totalPrice);
      },
      message: props => `🚫 deposit must be at least 30% of totalPrice or equal to totalPrice`
    }
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank_transfer", "qr"],
    default: "cash"
  },
  paymentType:{
    type: String,
    enum:["deposit" , "full"]
  },
  bankDetails: {
    bankName: { type: String },
    bankAccountNumber: { type: String }
  },
  qrCodeUrl: { type: String , default: "" },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed" , "deposited"],
    default: "pending"
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    citizenId: { type: String, required: true },
    address: { type: String, required: true }
  },
  contract: {
    url: { type: String },
    signed: { type: Boolean, default: false },
    signedBySeller: { type: Boolean, default: false },
    signedBySellerName: { type: String },
    signedBySellerAt: { type: Date },
    signatureImageBySeller: { type: String },
    signedByBuyer: { type: Boolean, default: false },
    signedByBuyerName: { type: String },
    signedByBuyerAt: { type: Date },
    signatureImageByBuyer: { type: String },
    status:{ type: String, enum: ["pending", "pending_admin", "not_signed" , "signed"], default:"pending" }
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "canceled" , "paid"],
    default: "pending"
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "🚫 quantity must be an integer"
    }
  },
  stripePaymentIntentId: { type: String, default: null, index: true },

  // ---------------- FIX: payment array ----------------
  payment: [
    {
      _id: { type: String, required: true },
      status: { type: String, enum: ["pending","paid","failed","deposited"], default: "pending" },
      amount: { type: Number, required: true },
      method: { type: String, enum: ["cash","bank_transfer","qr"], required: true },
      type: { type: String, enum: ["deposit","full"], required: true },
      createdAt: { type: Date, default: Date.now },
      name: { type: String },
      deleted: { type: Boolean, default: false }
    }
  ]

}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
