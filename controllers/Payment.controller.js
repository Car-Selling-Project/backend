import Stripe from "stripe";
import Order from "../models/orders.schema.js";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tạo QR động với thời gian hết hạn 20 phút
const createDynamicQR = async (order, clientSecret) => {
    const expiryTime = new Date(Date.now() + 20 * 60 * 1000); // 20 phút
    const paymentData = JSON.stringify({
        orderId: order._id,
        amount: order.totalPrice,
        currency: "USD",
        expiresAt: expiryTime.toISOString(),
        paymentMethod: "qr",
        clientSecret,
    });

    const qrImage = await QRCode.toDataURL(paymentData);
    return { qrImage, expiresAt: expiryTime };
};

// CREATE payment
export const createPayment = async (req, res) => {
    try {
        const { orderId, token } = req.body; // FE gửi kèm token nếu bank_transfer
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.paymentStatus !== "pending")
            return res.status(400).json({ message: `Order not in pending payment status` });

        // -----------------------------
        // CASE 1: Cash
        // -----------------------------
        if (order.paymentMethod === "cash") {
            return res.json({
                message: "Cash payment pending, confirm manually",
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
            });
        }

        // -----------------------------
        // CASE 2: Bank Transfer (Stripe + token từ client)
        // -----------------------------
        if (order.paymentMethod === "bank_transfer") {
            if (!token) {
                return res.status(400).json({ message: "Missing payment token from client" });
            }

            const amount = Math.round(order.totalPrice * 100); // USD cents
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: "usd",
                payment_method_data: {
                    type: "card",
                    card: { token }, // token FE gửi lên từ publishable key
                },
                confirm: true, // confirm ngay khi tạo
                metadata: {
                    orderId: order._id.toString(),
                    method: "bank_transfer",
                },
            });

            order.stripePaymentIntentId = paymentIntent.id;
            await order.save();

            return res.json({
                message: "Bank transfer initiated via Stripe",
                paymentMethod: order.paymentMethod,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
            });
        }

        // -----------------------------
        // CASE 3: QR Payment
        // -----------------------------
        if (order.paymentMethod === "qr") {
            let paymentIntent;

            if (!order.stripePaymentIntentId) {
                const amount = Math.round(order.totalPrice * 100);

                paymentIntent = await stripe.paymentIntents.create({
                    amount,
                    currency: "usd",
                    metadata: {
                        orderId: order._id.toString(),
                        method: "qr",
                    },
                });

                order.stripePaymentIntentId = paymentIntent.id;

                // Tạo QR chứa client_secret + order info
                const { qrImage, expiresAt } = await createDynamicQR(
                    order,
                    paymentIntent.client_secret
                );

                order.qrCodeUrl = qrImage;
                order.qrCodeExpiresAt = expiresAt;

                await order.save();
            } else {
                paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
            }

            return res.json({
                message: "QR payment created via Stripe",
                paymentMethod: order.paymentMethod,
                clientSecret: paymentIntent.client_secret,
                qrCodeUrl: order.qrCodeUrl,
                qrCodeExpiresAt: order.qrCodeExpiresAt,
                status: paymentIntent.status,
            });
        }

        return res.status(400).json({ message: "Unsupported payment method" });

    } catch (error) {
        console.error("Error in createPayment:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// CONFIRM payment
export const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.paymentStatus !== "pending")
            return res.status(400).json({ message: `Order is not pending` });

        // Trường hợp thanh toán tiền mặt → xác nhận thủ công
        if (order.paymentMethod === "cash") {
            order.paymentStatus = "confirmed";
            await order.save();
            return res.json({ message: "Payment confirmed manually", paymentStatus: order.paymentStatus });
        }

        // Trường hợp thanh toán Stripe → kiểm tra PaymentIntent
        if (!order.stripePaymentIntentId) {
            console.error(`Error: stripePaymentIntentId not found for order ID ${orderId}.`);
            return res.status(400).json({ message: "PaymentIntentId not found for this order" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

        if (paymentIntent.status === "succeeded") {
            order.paymentStatus = "confirmed";
            await order.save();
            return res.json({ message: "Payment confirmed via Stripe", paymentStatus: order.paymentStatus });
        } else {
            return res.status(400).json({ message: `Payment not completed yet` });
        }

    } catch (error) {
        console.error("Error in confirmPayment:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// CANCEL payment
export const cancelPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.paymentStatus !== "pending")
            return res.status(400).json({ message: `Order is not pending` });

        if (order.stripePaymentIntentId) {
            await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        }

        order.paymentStatus = "cancelled";
        await order.save();
        return res.json({ message: "Payment cancelled successfully", paymentStatus: order.paymentStatus });

    } catch (error) {
        console.error("Error in cancelPayment:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};