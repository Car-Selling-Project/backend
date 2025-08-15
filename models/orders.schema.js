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
        // Nếu deposit > 0, phải >= 30% tổng giá và <= 100%
        if (!this.totalPrice) return true; // skip nếu totalPrice chưa set
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
  bankDetails: {
    bankName: { type: String }, // chỉ điền nếu paymentMethod === "bank_transfer"
    bankAccountNumber: { type: String }
  },
  qrCodeUrl: { type: String }, // chỉ dùng nếu paymentMethod === "qr"
  paymentStatus: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
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
  url: { type: String },                    // link hợp đồng PDF
  signed: { type: Boolean, default: false }, // tổng quan đã ký đủ chưa
  signedBySeller: { type: Boolean, default: false },
  signedBySellerName: { type: String },
  signedBySellerAt: { type: Date },
  signatureImageBySeller: { type: String }, // lưu ảnh chữ ký seller

  signedByBuyer: { type: Boolean, default: false },
  signedByBuyerName: { type: String },
  signedByBuyerAt: { type: Date },
  signatureImageByBuyer: { type: String }   // lưu ảnh chữ ký buyer
}
,
  status: {
    type: String,
    enum: ["pending", "confirmed", "canceled"],
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
  }
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
