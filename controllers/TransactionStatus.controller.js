import mongoose from "mongoose";
import Transaction from "../models/transactions.schema.js";

// Cập nhật trạng thái transaction
export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["success", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Lấy transaction kèm order
    const transaction = await Transaction.findById(id).populate("order");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "success") {
      return res.status(400).json({ message: "Transaction already successful" });
    }

    transaction.status = status;
    await transaction.save();

    if (status === "success") {
      // Cập nhật trạng thái order
      const Order = mongoose.model("Order");
      const Car = mongoose.model("Car");

      const order = await Order.findById(transaction.order._id);
      if (order && order.status !== "confirmed") {
        order.status = "confirmed";
        await order.save();
      }

      // Giảm stock xe
      const car = await Car.findById(order.carInfo);
      if (car && car.stock > 0) {
        car.stock -= 1;
        await car.save();
      }
    }

    return res.status(200).json({
      message: `Transaction status updated to ${status}`,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update transaction", error: error.message });
  }
};

// Hủy transaction pending quá 5 phút
export const expirePendingTransactions = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const expiredTxs = await Transaction.updateMany(
      { status: "pending", createdAt: { $lt: fiveMinutesAgo } },
      { status: "failed" }
    );

    // Có thể rollback order nếu muốn

    return res.status(200).json({
      message: `Expired ${expiredTxs.modifiedCount} pending transactions`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to expire transactions", error: error.message });
  }
};
