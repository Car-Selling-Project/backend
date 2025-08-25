import Order from "../models/orders.schema.js";
import QRCode from "qrcode";
import { computeOrderStatus } from "../helper.js";

// Fake card info
export const FAKE_CARD = {
  number: "4242 4242 4242 4242",
  exp_month: "12",
  exp_year: "34",
  cvc: "123",
};

// Fake PaymentIntent generator
const generateFakePaymentIntent = (orderId, amount) => ({
  id: `pi_fake_${Date.now()}`,
  client_secret: `cs_fake_${Date.now()}`,
  amount,
  metadata: { orderId },
  status: "requires_payment_method",
});

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
    let finalAmount = 0;

    // Xác định số tiền
    if (paymentType === "deposit") finalAmount = order.deposit;
    else if (paymentType === "full") finalAmount = order.totalPrice;

    let status = "pending";
    if (paymentType === "deposit" && paymentMethod === "cash") status = "deposited";
    if (paymentType === "full" && paymentMethod === "cash") status = "paid";

    // Fake PaymentIntent cho bank/qr
    if (["bank_transfer", "qr"].includes(paymentMethod)) {
      const paymentIntent = generateFakePaymentIntent(order._id.toString(), Math.round(finalAmount * 100));
      clientSecret = paymentIntent.client_secret;
      order.stripePaymentIntentId = paymentIntent.id;

      if (paymentMethod === "qr") {
        qrData = await createDynamicQR(order, clientSecret);
        order.qrCodeUrl = qrData.qrCode;
      }
    }

    const newPayment = {
      _id: `payment_${Date.now()}`,
      status,
      amount: finalAmount,
      method: paymentMethod,
      type: paymentType,
      createdAt: new Date(),
      name: paymentType === "deposit" ? "Deposit" : "Full Payment",
      deleted: false,
    };

    order.payment = order.payment || [];
    order.payment.push(newPayment);
    order.paymentMethod = paymentMethod;
    order.paymentType = paymentType;

    computeOrderStatus(order);
    await order.save();

    res.json({
      message: "Payment created (FAKE)",
      payment: newPayment,
      clientSecret,
      qrData,
      status: newPayment.status,
      fakeCard: FAKE_CARD,
    });
  } catch (error) {
    console.error("❌ Error createPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== CANCEL PAYMENT ==================
export const cancelPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.payment || order.payment.length === 0)
      return res.status(400).json({ message: "No payments found" });

    const payment = order.payment.find(p => p._id === paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "failed";
    payment.deleted = true;

    computeOrderStatus(order);
    await order.save();

    res.json({ message: "Payment cancelled", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ================== CONFIRM PAYMENT ==================
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    if (!orderId || !paymentId)
      return res.status(400).json({ message: "orderId and paymentId are required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const payment = order.payment.find(p => p._id === paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // ✅ Chỉ confirm nếu đang pending hoặc deposited
    if (["pending", "deposited"].includes(payment.status)) {
      payment.status = "paid";
      payment.deleted = false;

      // Cập nhật paymentStatus chung nếu muốn
      order.paymentStatus = "paid";

      computeOrderStatus(order);
      await order.save();
    }

    res.json({
      message: "Payment confirmed",
      payment,
      paymentStatus: payment.status
    });
  } catch (error) {
    console.error("❌ Error confirmPayment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getPaymentForCustomer = async (req, res) => {
  try {
    const customerId = req.customer._id;

    const orders = await Order.find({ customerId })
      .select("totalPrice deposit payment paymentStatus paymentMethod paymentType createdAt");

    // Trả về luôn mảng payment chi tiết
    res.json({ data: orders });
  } catch (error) {
    console.error("❌ Error getPaymentsForCustomer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getPaymentForAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .select("totalPrice deposit payment paymentStatus paymentMethod paymentType createdAt");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      orderId: order._id,
      payment: order.payment || [],
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      deposit: order.deposit
    });
  } catch (error) {
    console.error("❌ Error getPaymentsForAdmin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
