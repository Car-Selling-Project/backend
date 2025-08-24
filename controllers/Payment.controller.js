import Order from "../models/orders.schema.js";
import QRCode from "qrcode";
import { computeOrderStatus } from "../helper.js"; // ✅ import thêm

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

// ================== CREATE PAYMENT ==================
export const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentType } = req.body;

    const validMethods = ["cash", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod))
      return res.status(400).json({ message: "Invalid payment method" });

    if (!["deposit", "full"].includes(paymentType))
      return res.status(400).json({ message: "Invalid payment type" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let clientSecret = null;
    let qrData = null;
    let amount = 0;

    // ✅ Xác định số tiền theo type
    if (paymentType === "deposit") {
      amount = order.deposit;
      order.paymentStatus = "deposited";
    } else if (paymentType === "full") {
      amount = order.totalPrice;

      if (paymentMethod === "cash") {
        order.paymentStatus = "paid";
      } else {
        order.paymentStatus = "pending";
      }
    }

    // ✅ Nếu là bank/qr → tạo fake PaymentIntent
    if (["bank_transfer", "qr"].includes(paymentMethod)) {
      const paymentIntent = generateFakePaymentIntent(order._id.toString(), Math.round(amount * 100));
      clientSecret = paymentIntent.client_secret;
      order.stripePaymentIntentId = paymentIntent.id;

      if (paymentMethod === "qr") {
        qrData = await createDynamicQR(order, clientSecret);
        order.qrCodeUrl = qrData.qrCode;
      }
    }

    order.paymentMethod = paymentMethod;
    order.paymentType = paymentType;

    // ✅ Gọi helper tính trạng thái order
    computeOrderStatus(order);

    await order.save();

    return res.json({
      message: "Payment created (FAKE)",
      paymentMethod,
      paymentType,
      clientSecret,
      qrData,
      amount,
      status: order.paymentStatus,
      fakeCard: FAKE_CARD,
    });
  } catch (error) {
    console.error("❌ Error createPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== CONFIRM PAYMENT ==================
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["bank_transfer", "qr"].includes(order.paymentMethod)) {
      if (order.paymentStatus === "pending") {
        order.paymentStatus = "paid";
        computeOrderStatus(order);
        await order.save();
      }
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

// ================== CANCEL PAYMENT ==================
export const cancelPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = "failed"; // ✅ set failed
    computeOrderStatus(order);
    await order.save();

    return res.json({ message: "Payment cancelled (FAKE)", status: order.paymentStatus });
  } catch (error) {
    console.error("❌ Error cancelPayment:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// ---------------- Admin ----------------
export const getPaymentForAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId, "payment"); // lấy toàn bộ payment
    if (!order) return res.status(404).json({ message: "Order not found" });

    const payment = order.payment || {};
    const paymentStatus = payment.status || null;

    res.json({
      payment,
      paymentStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

// ---------------- Customer ----------------
export const getPaymentForCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.customer._id;

    if (!customerId) 
      return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.findOne(
      { _id: orderId, customerId },
      "payment"
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    const payment = order.payment || {};
    const paymentStatus = payment.status || null;

    res.json({
      payment,
      paymentStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
