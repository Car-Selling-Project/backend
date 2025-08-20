import Order from "../models/orders.schema.js";
import QRCode from "qrcode";

// Fake card info (dùng để test)
export const FAKE_CARD = {
  number: "4242 4242 4242 4242",
  exp_month: "12",
  exp_year: "34",
  cvc: "123",
};

// Fake PaymentIntent generator
const generateFakePaymentIntent = (orderId, amount) => {
  return {
    id: `pi_fake_${Date.now()}`,
    client_secret: `cs_fake_${Date.now()}`,
    amount,
    metadata: { orderId },
    status: "requires_payment_method",
  };
};

// Tạo QR code động
const createDynamicQR = async (order, clientSecret) => {
  const expiryTime = new Date(Date.now() + 20 * 60 * 1000);
  const qrData = JSON.stringify({
    orderId: order._id,
    amount: order.totalPrice,
    clientSecret,
    expiry: expiryTime,
  });
  const qrCode = await QRCode.toDataURL(qrData);
  return { qrCode, expiryTime };
};

// Tạo payment (fake)
export const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const validMethods = ["cash", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod))
      return res.status(400).json({ message: "Invalid payment method" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let clientSecret = null;
    let qrData = null;

    if (["bank_transfer", "qr"].includes(paymentMethod)) {
      // Fake PaymentIntent
      const paymentIntent = generateFakePaymentIntent(order._id.toString(), Math.round(order.totalPrice * 100));
      clientSecret = paymentIntent.client_secret;
      order.stripePaymentIntentId = paymentIntent.id;

      if (paymentMethod === "qr") {
        qrData = await createDynamicQR(order, clientSecret);
        order.qrCodeUrl = qrData.qrCode;
      }

      order.paymentStatus = "pending";
    } else if (paymentMethod === "cash") {
      order.paymentStatus = "confirmed";
    }

    order.paymentMethod = paymentMethod;
    await order.save();

    return res.json({
      message: "Payment created (FAKE)",
      paymentMethod,
      clientSecret,
      qrData,
      status: order.paymentStatus,
      fakeCard: FAKE_CARD, // gửi thông tin fake card luôn
    });
  } catch (error) {
    console.error("❌ Error createPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Confirm payment offline
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["bank_transfer", "qr"].includes(order.paymentMethod)) {
      order.paymentStatus = "confirmed";
      await order.save();
      return res.json({
        message: `Payment confirmed for ${order.paymentMethod} (FAKE)`,
        status: order.paymentStatus,
      });
    }

    if (order.paymentMethod === "cash") {
      return res.json({
        message: "Cash payment already confirmed",
        status: order.paymentStatus,
      });
    }

    return res.status(400).json({ message: "Cannot confirm unknown payment method" });
  } catch (error) {
    console.error("❌ Error confirmPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel payment
export const cancelPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "pending")
      return res.status(400).json({ message: "Order is not pending" });

    order.paymentStatus = "canceled";
    await order.save();

    return res.json({ message: "Payment cancelled (FAKE)", status: order.paymentStatus });
  } catch (error) {
    console.error("❌ Error cancelPayment:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
