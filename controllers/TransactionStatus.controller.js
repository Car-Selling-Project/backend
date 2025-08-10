import Transaction from "../models/transactions.schema.js";
import Order from "../models/orders.schema.js";
import Car from "../models/cars.schema.js";

// Cập nhật trạng thái transaction (chỉ Admin)
export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra quyền admin
    if (!req.admin || !req.admin._id) {
      return res.status(403).json({ message: "🚫 Unauthorized: Admin access required" });
    }

    // Validate status hợp lệ
    if (!["success", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "🚫 Invalid status" });
    }

    // Lấy transaction kèm order
    const transaction = await Transaction.findById(id).populate("order");
    if (!transaction) {
      return res.status(404).json({ message: "❌ Transaction not found" });
    }

    // Nếu đã success rồi thì không cho đổi nữa
    if (transaction.status === "success") {
      return res.status(400).json({ message: "⚠ Transaction already successful" });
    }

    // Cập nhật trạng thái + người confirm
    transaction.status = status;
    transaction.confirmBy = req.admin._id;
    await transaction.save();

    if (status === "success") {
      // Cập nhật trạng thái order
      const order = await Order.findById(transaction.order._id);
      if (order && order.status !== "confirmed") {
        order.status = "confirmed";
        await order.save();
      }

      // Giảm stock xe
      if (order?.carInfo) {
        const carId = order.carInfo._id || order.carInfo; // Nếu là object populate thì lấy _id
        const car = await Car.findById(carId);
        if (car && car.stock > 0) {
          car.stock -= 1;
          await car.save();
        }
      }
    }

    // Populate lại transaction sau khi update
    const updatedTx = await Transaction.findById(transaction._id).populate("order");

    return res.status(200).json({
      message: `✅ Transaction status updated to ${status}`,
      data: updatedTx
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to update transaction",
      error: error.message
    });
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

    return res.status(200).json({
      message: `Expired ${expiredTxs.modifiedCount} pending transactions`,
    });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to expire transactions", error: error.message });
  }
};
