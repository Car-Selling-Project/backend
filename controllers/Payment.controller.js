import Stripe from "stripe";
import Order from "../models/orders.schema.js";
import { computeOrderStatus } from "../helper.js";

// ================== STRIPE CONFIG ==================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ================== CREATE PAYMENT ==================
export const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentType } = req.body;

    const validMethods = ["cash", "card", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (!["deposit", "full"].includes(paymentType)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let amount = 0;
    if (paymentType === "deposit") {
      amount = order.deposit;
      order.paymentStatus = "deposited";
    } else {
      amount = order.totalPrice;
      if (paymentMethod === "cash") {
        order.paymentStatus = "paid"; // đã đưa tiền mặt
      } else {
        order.paymentStatus = "pending"; // chờ confirm qua Stripe
      }
    }

    let clientSecret = null;

    // ✅ Nếu dùng Stripe (card / bank_transfer / qr)
    if (["card", "bank_transfer", "qr"].includes(paymentMethod)) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe tính bằng cent
        currency: "usd",
        payment_method_types: ["card"], // sau này có thể thêm bank_transfer
        metadata: {
          orderId: order._id.toString(),
          paymentType,
        },
      });

      clientSecret = paymentIntent.client_secret;
      order.stripePaymentIntentId = paymentIntent.id;
    }

    order.paymentMethod = paymentMethod;
    order.paymentType = paymentType;
    computeOrderStatus(order);
    await order.save();

    return res.json({
      message: "Payment created",
      clientSecret,
      amount,
      status: order.paymentStatus,
    });
  } catch (error) {
    console.error("❌ Error createPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== STRIPE WEBHOOK ==================
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // ⚠️ cần express.raw() middleware
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "paid";
          computeOrderStatus(order);
          await order.save();
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = "failed";
          computeOrderStatus(order);
          await order.save();
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Error in webhook:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== GET PAYMENT FOR ADMIN ==================
export const getPaymentForAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId, "paymentStatus paymentMethod paymentType stripePaymentIntentId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      paymentMethod: order.paymentMethod,
      paymentType: order.paymentType,
      status: order.paymentStatus,
      stripePaymentIntentId: order.stripePaymentIntentId || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== GET PAYMENT FOR CUSTOMER ==================
export const getPaymentForCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.customer._id;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findOne(
      { _id: orderId, customerId },
      "paymentStatus paymentMethod paymentType stripePaymentIntentId"
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      paymentMethod: order.paymentMethod,
      paymentType: order.paymentType,
      status: order.paymentStatus,
      stripePaymentIntentId: order.stripePaymentIntentId || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ================== CONFIRM PAYMENT (manual / cash) ==================
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Nếu là COD thì cho admin confirm
    if (order.paymentMethod === "cash") {
      order.paymentStatus = "paid";
      computeOrderStatus(order);
      await order.save();
      return res.json({ message: "Cash payment confirmed", status: order.paymentStatus });
    }

    // Stripe thì webhook xử lý, không cho confirm tay
    return res.status(400).json({ message: "Cannot manually confirm Stripe payment" });
  } catch (error) {
    console.error("❌ Error confirmPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== CANCEL PAYMENT (manual / cash) ==================
export const cancelPayment = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Nếu là COD thì cho admin cancel
    if (order.paymentMethod === "cash") {
      order.paymentStatus = "failed";
      computeOrderStatus(order);
      await order.save();
      return res.json({ message: "Cash payment cancelled", status: order.paymentStatus });
    }

    // Stripe thì có thể hủy PaymentIntent
    if (order.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        order.paymentStatus = "failed";
        computeOrderStatus(order);
        await order.save();
        return res.json({ message: "Stripe payment cancelled", status: order.paymentStatus });
      } catch (stripeErr) {
        return res.status(400).json({ message: "Failed to cancel Stripe payment", error: stripeErr.message });
      }
    }

    return res.status(400).json({ message: "Cannot cancel unknown payment method" });
  } catch (error) {
    console.error("❌ Error cancelPayment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
