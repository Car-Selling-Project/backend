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
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            console.error(`Error: Order with ID ${orderId} not found.`);
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.paymentStatus !== "pending") {
            console.error(`Error: Order ${orderId} is not in pending payment status. Current status: ${order.paymentStatus}`);
            return res.status(400).json({ message: `Order not in pending payment status` });
        }

        // Trường hợp thanh toán tiền mặt → xác nhận thủ công
        if (order.paymentMethod === "cash") {
            return res.json({
                message: "Cash payment pending, confirm manually",
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
            });
        }

        // Trường hợp thanh toán qua Stripe (chuyển khoản ngân hàng / QR)
        let paymentIntent;
        if (!order.stripePaymentIntentId) {
            console.log(`Creating new PaymentIntent for order ID: ${orderId}`);
            const amount = Math.round(order.totalPrice) * 100;
            paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: "usd",
                metadata: { orderId: order._id.toString(), paymentMethod: order.paymentMethod },
            });
            order.stripePaymentIntentId = paymentIntent.id;

            // Nếu là QR → tạo QR chứa clientSecret
            if (order.paymentMethod === "qr") {
                const { qrImage, expiresAt } = await createDynamicQR(order, paymentIntent.client_secret);
                order.qrCodeUrl = qrImage;
                order.qrCodeExpiresAt = expiresAt;
            }

            // Lưu PaymentIntent ID vào database
            await order.save();
            console.log(`Successfully saved PaymentIntent ID to order: ${order.stripePaymentIntentId}`);
        } else {
            console.log(`Retrieving existing PaymentIntent with ID: ${order.stripePaymentIntentId} for order ID: ${orderId}`);
            paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        }

        return res.json({
            message: "Payment created via Stripe",
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            qrCodeUrl: order.qrCodeUrl || null,
            qrCodeExpiresAt: order.qrCodeExpiresAt || null,
        });

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