import dotenv from "dotenv";
import Stripe from "stripe";
import Order from "../models/orders.schema.js";
import QRCode from "qrcode";

dotenv.config();

// Lấy key từ env
const stripeKey = process.env.STRIPE_SECRET_KEY;

// Nếu không có key thì throw lỗi rõ ràng
if (!stripeKey) {
  throw new Error("❌ Missing STRIPE_SECRET_KEY in environment variables");
}

// Tạo Stripe instance
const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-06-20",
});

const createDynamicQR = async (order, clientSecret) => {
  const expiryTime = new Date(Date.now() + 20 * 60 * 1000);
  const qrData = JSON.stringify({
    orderId: order._id,
    amount: order.totalPrice, // ✅ đổi totalAmount -> totalPrice
    clientSecret,
    expiry: expiryTime,
  });

  const qrCode = await QRCode.toDataURL(qrData);
  return { qrCode, expiryTime };
};


export const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const validMethods = ["cash", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const amount = Number(order.totalPrice);
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid order totalPrice" });
    }

    let clientSecret = null;
    let qrData = null;

    if (paymentMethod === "bank_transfer" || paymentMethod === "qr") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // ✅ cents
        currency: "usd",
        metadata: { orderId: order._id.toString() },
      });

      clientSecret = paymentIntent.client_secret;
      order.stripePaymentIntentId = paymentIntent.id; // ✅ lưu lại để cancel sau

      if (paymentMethod === "qr") {
        qrData = await createDynamicQR(order, clientSecret);
      }
    }

    order.paymentMethod = paymentMethod;
    await order.save();

    return res.json({
      message: "✅ Payment created",
      paymentMethod,
      clientSecret,
      qrData,
    });
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// controllers/payment.controller.js
export const confirmPayment = async (req, res) => {
  try {
    const { clientSecret, paymentMethod } = req.body;
    if (!clientSecret) {
      return res.status(400).json({ message: "clientSecret is required" });
    }

    const paymentIntentId = clientSecret.split("_secret")[0];
    if (paymentMethod) {
      await stripe.paymentIntents.update(paymentIntentId, { payment_method: paymentMethod });
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      return res.status(200).json({
        message: "Payment successful",
        status: paymentIntent.status,
      });
    }

    return res.status(400).json({
      message: "Payment not completed",
      status: paymentIntent.status,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



// CANCEL payment
export const cancelPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({ message: `Order is not pending` });
    }

    if (order.stripePaymentIntentId) {
      await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    }

    order.paymentStatus = "canceled"; // ✅ schema dùng "canceled" chứ không phải "cancelled"
    await order.save();

    return res.json({
      message: "Payment cancelled successfully",
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("❌ Error in cancelPayment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
