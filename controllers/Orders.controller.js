import Order from "../models/orders.schema.js";
// Create Order
export const createOrder = async (req, res) => {
  try {
    const newOrder = await Order.create(req.body);

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("customerId", "name email phone citizenId")
      .populate("carId", "title price")
      .populate("locationId", "name");

    return res.status(201).json({
      message: "✅ Order created successfully",
      data: populatedOrder
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to create order",
      error: error.message
    });
  }
};
// Get All Order and Order with filter
export const getAllOrders = async (req, res) => {
  try {
    const {
      customerId,
      carId,
      locationId,
      status,
      paymentMethod
    } = req.query;

    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (carId) filter.carId = carId;
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const orders = await Order.find(filter)
      .populate("customerId", "name email phone , citizenId")   // chọn trường cần thiết
      .populate("carId", "title price")
      .populate("locationId", "name");

    return res.status(200).json({
      message: "✅ Get all orders successfully",
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get orders",
      error: error.message
    });
  }
};
// Get Order follow Id
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
      .populate("customerId", "name email phone citizenId")
      .populate("carId", "title price")
      .populate("locationId", "name");

    if (!order) {
      return res.status(404).json({
        message: "❌ Order not found",
      });
    }

    return res.status(200).json({
      message: "✅ Get order successfully",
      data: order,
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
      runValidators: true
    })
      .populate("customerId", "name email phone citizenId")
      .populate("carId", "title price")
      .populate("locationId", "name");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "❌ Order not found"
      });
    }

    return res.status(200).json({
      message: "✅ Order updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to update order",
      error: error.message
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