import Order from "../models/orders.schema.js";

export const createOrder = async (req, res) => {
  try {
    const adminId = req.admin?._id;

    // ✅ Không sửa req.body trực tiếp
    const payload = {
      ...req.body,
      admin: adminId,
    };

    const newOrder = await Order.create(payload);

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("admin", "name")
      .populate("carInfo", "-locationId")
      .populate("location", "name")
      .populate("customerId", "name");  

    return res.status(201).json({
      message: "✅ Order created successfully",
      data: populatedOrder,
      customer: populatedOrder.customerId // trả riêng phần customerId info cho frontend nếu cần
        ? { id: populatedOrder.customerId._id, name: populatedOrder.customerId.fullName }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to create order",
      error: error.message,
    });
  }
};

// Get All Order and Order with filter
export const getAllOrders = async (req, res) => {
  try {
    const {
      admin,
      carInfo,
      location,
      status,
      paymentMethod,
      customerId
    } = req.query;

    const filter = {};

    if (admin) filter.admin = admin;
    if (carInfo) filter.carInfo = carInfo;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if(customerId) filter.customerId = customerId;

    const orders = await Order.find(filter)
      .populate("admin", "name")
      .populate("carInfo", "-locationId")
      .populate("location", "name")
      .populate("customerId", "name");  

    return res.status(200).json({
      message: "✅ Get all orders successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get orders",
      error: error.message,
    });
  }
};

// Get Order follow Id
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
      .populate("admin", "name")
      .populate("carInfo", "-locationId")
      .populate("location", "name")
      .populate("customerId", "name"); 

    if (!order) {
      return res.status(404).json({
        message: "❌ Order not found",
      });
    }

    return res.status(200).json({
      message: "✅ Get order successfully",
      data: order,
      customer: order.customerId
        ? { id: order.customerId._id, name: order.customerId.name }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get order",
      error: error.message,
    });
  }
};

// Update orders
export const updateOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("admin", "name")
      .populate("carInfo", "-locationId")
      .populate("location", "name")
      .populate("customerId", "_id fullName");  // Thêm customerId

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "❌ Order not found",
      });
    }

    return res.status(200).json({
      message: "✅ Order updated successfully",
      data: updatedOrder,
      customer: updatedOrder.customerId
        ? { id: updatedOrder.customerId._id, name: updatedOrder.customerId.name }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to update order",
      error: error.message,
    });
  }
};

// Delete order 
export const deleteOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};
