import Stripe from "stripe";
import Order from "../models/orders.schema.js";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tạo QR dynamic với expiry 20 phút
const createDynamicQR = async (order) => {
  const expiryTime = new Date(Date.now() + 20 * 60 * 1000); // 20 phút từ bây giờ
  const paymentData = JSON.stringify({
    orderId: order._id,
    amount: order.totalPrice,
    currency: "USD",
    expiresAt: expiryTime.toISOString(),
    paymentMethod: "qr",
  });

  const qrImage = await QRCode.toDataURL(paymentData);
  return { qrImage, expiresAt: expiryTime };
};

export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: `Order is not in pending payment status (current: ${order.paymentStatus})`,
      });
    }

    // Bank transfer
    if (order.paymentMethod === "bank_transfer") {
      return res.json({
        message: "Bank transfer payment - awaiting customer transfer",
        paymentMethod: order.paymentMethod,
        bankDetails: order.bankDetails,
        paymentStatus: order.paymentStatus,
      });
    }

    // QR dynamic payment
    if (order.paymentMethod === "qr") {
      let needNewQR = true;

      if (order.qrCodeExpiresAt && new Date(order.qrCodeExpiresAt) > new Date()) {
        // QR cũ còn hạn
        needNewQR = false;
      }

      if (needNewQR) {
        const { qrImage, expiresAt } = await createDynamicQR(order);
        order.qrCodeUrl = qrImage;
        order.qrCodeExpiresAt = expiresAt;
        await order.save();
      }

      return res.json({
        message: "QR payment created - scan to pay",
        paymentMethod: order.paymentMethod,
        qrCodeUrl: order.qrCodeUrl,
        expiresAt: order.qrCodeExpiresAt,
        paymentStatus: order.paymentStatus,
      });
    }

    // Cash / Deposit
    if (["cash", "deposit"].includes(order.paymentMethod)) {
      return res.json({
        message: "Cash/Deposit payment pending",
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      });
    }

    // Stripe
    const amount = Math.round(order.deposit || order.totalPrice) * 100; // cent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return res.json({
      message: "Online payment created",
      paymentMethod: order.paymentMethod,
      stripe: true,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: `Order is not in pending status (current: ${order.paymentStatus})`,
      });
    }

    // Bank transfer, QR, cash → xác nhận thủ công
    if (["bank_transfer", "qr", "cash"].includes(order.paymentMethod)) {
      order.paymentStatus = "confirmed";
      await order.save();
      return res.json({
        message: "Payment confirmed manually",
        paymentStatus: order.paymentStatus,
      });
    }

    // Stripe
    if (!order.paymentIntentId) {
      return res.status(400).json({ message: "No paymentIntentId for this order" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    if (paymentIntent.status === "succeeded") {
      order.paymentStatus = "confirmed";
      await order.save();
      return res.json({
        message: "Stripe payment confirmed",
        paymentStatus: order.paymentStatus,
      });
    } else {
      return res.status(400).json({
        message: `Payment not completed yet (status: ${paymentIntent.status})`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const cancelPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: `Order is not in pending status (current: ${order.paymentStatus})`,
      });
    }

    // Stripe
    if (!["cash", "deposit", "bank_transfer", "qr"].includes(order.paymentMethod) && order.paymentIntentId) {
      await stripe.paymentIntents.cancel(order.paymentIntentId);
    }

    order.paymentStatus = "cancelled";
    await order.save();

    return res.json({
      message: "Payment cancelled successfully",
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
