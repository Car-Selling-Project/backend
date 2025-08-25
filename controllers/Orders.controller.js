// controllers/orders.controller.js
import Order from "../models/orders.schema.js";
import Car from "../models/cars.schema.js";
import Admin from "../models/admins.schema.js";

// ======================= HELPERS =======================
const populateOrder = (query) =>
  query
    .populate("admin", "name email")
    .populate("carInfo")
    .populate("location", "name");

const orderResponse = (order) => ({
  id: order._id,
  data: order,
  customer: order.customerId
    ? { id: order.customerId._id, name: order.customerId.name }
    : null,
  contractStatus: order.contract?.status || "pending",
  paymentType: order.paymentType || "full",
  paymentStatus: order.paymentStatus || "pending",
  status: order.status || "pending",
});

// ======================= CREATE ORDER (ADMIN) =======================
export const createOrder = async (req, res) => {
  try {
    const adminId = req.admin?._id;
    const {
      carInfo: carId,
      quantity = 1,
      paymentMethod,
      bankDetails,
      deposit: reqDeposit,
      paymentType = "full",
      ...rest
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "❌ Car not found" });

    // Tính toán giá
    const registrationFee = 500;
    const insuranceFee = 300;
    const taxRate = 0.1;
    const carSubtotal = car.price * quantity;
    const tax = carSubtotal * taxRate;
    const fullPrice = Math.round(carSubtotal + tax + registrationFee + insuranceFee);

    // Kiểm tra deposit
    let depositAmount = 0;
    if (paymentType === "deposit") {
      if (!reqDeposit)
        return res.status(400).json({ message: "❌ Deposit amount is required" });

      const minDeposit = Math.round(0.3 * fullPrice);
      if (reqDeposit < minDeposit || reqDeposit > fullPrice) {
        return res.status(400).json({
          message: `❌ Deposit must be between 30% and 100% of totalPrice (${minDeposit} - ${fullPrice})`,
        });
      }
      depositAmount = reqDeposit;
    } else {
      depositAmount = fullPrice;
    }

    // Khởi tạo payload
    const payload = {
      ...rest,
      admin: adminId,
      carInfo: carId,
      quantity,
      totalPrice: fullPrice,
      deposit: depositAmount,
      paymentType,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      contract: { status: "pending" },
      bankDetails: {},
      qrCodeUrl: "",
    };

    // Validate bank transfer
    if (paymentMethod === "bank_transfer") {
      if (!bankDetails?.bankName || !bankDetails?.bankAccountNumber) {
        return res.status(400).json({
          message: "❌ Bank name and account number are required for bank transfer",
        });
      }
      payload.bankDetails = {
        bankName: bankDetails.bankName,
        bankAccountNumber: bankDetails.bankAccountNumber,
      };
    }

    // Validate QR
 if (paymentMethod === "qr") {
  // Backend tự tạo QR code, không cần FE gửi qrCodeUrl
  payload.qrCodeUrl = "";
}


    const newOrder = await Order.create(payload);
    const populatedOrder = await populateOrder(Order.findById(newOrder._id));

    return res.status(201).json({
      message: "✅ Order created successfully",
      ...orderResponse(populatedOrder),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "❌ Failed to create order", error: error.message });
  }
};

// ======================= GET ALL ORDERS (ADMIN) =======================
export const getAllOrders = async (req, res) => {
  try {
    const {
      admin,
      carInfo,
      location,
      status,
      paymentMethod,
      customerId,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (admin) filter.admin = admin;
    if (carInfo) filter.carInfo = carInfo;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (customerId) filter.customerId = customerId;
    if (minPrice) filter.totalPrice = { ...filter.totalPrice, $gte: Number(minPrice) };
    if (maxPrice) filter.totalPrice = { ...filter.totalPrice, $lte: Number(maxPrice) };
    if (startDate) filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await populateOrder(
      Order.find(filter)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(Number(limit))
    );

    return res.status(200).json({
      message: "✅ Get orders successfully",
      data: orders.map(orderResponse),
      pagination: { page: Number(page), limit: Number(limit), count: orders.length },
    });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get orders", error: error.message });
  }
};

// ======================= GET ORDER BY ID =======================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await populateOrder(Order.findById(id));
    if (!order) return res.status(404).json({ message: "❌ Order not found" });
    return res.status(200).json({ message: "✅ Get order successfully", ...orderResponse(order) });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get order", error: error.message });
  }
};

// ======================= UPDATE ORDER =======================
export const updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await populateOrder(
      Order.findByIdAndUpdate(
        id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
    if (!updatedOrder) return res.status(404).json({ message: "❌ Order not found" });

    if (!updatedOrder.contract?.status) updatedOrder.contract = { status: "pending" };
    if (!updatedOrder.paymentStatus) updatedOrder.paymentStatus = "pending";
    if (!updatedOrder.paymentType) updatedOrder.paymentType = "full";
    if (!updatedOrder.status) updatedOrder.status = "pending";
    await updatedOrder.save();

    return res.status(200).json({ message: "✅ Order updated successfully", ...orderResponse(updatedOrder) });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to update order", error: error.message });
  }
};
// ======================= CONFIRM ORDER =======================
export const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "❌ Order not found" });
    }

    if (order.status === "confirmed") {
      return res.status(400).json({ message: "❌ Order already confirmed" });
    }

    order.status = "confirmed";
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));
    return res.status(200).json({
      message: "✅ Order confirmed successfully",
      ...orderResponse(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to confirm order",
      error: error.message,
    });
  }
};

// ======================= CANCEL ORDER =======================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "❌ Order not found" });
    }

    if (order.status === "canceled") {
      return res.status(400).json({ message: "❌ Order already canceled" });
    }

    order.status = "canceled";
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));
    return res.status(200).json({
      message: "✅ Order canceled successfully",
      ...orderResponse(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to cancel order",
      error: error.message,
    });
  }
};


// ======================= CUSTOMER APIs =======================
export const getOrdersForCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) return res.status(401).json({ message: "Unauthorized" });

    const { status } = req.query;
    const filter = { customerId, ...(status ? { status } : {}) };

    const orders = await populateOrder(Order.find(filter));
    res.status(200).json({
      message: "✅ Orders retrieved successfully",
      data: orders.map(orderResponse),
    });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get orders", error: error.message });
  }
};

export const getOrderByIdForCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?._id;
    if (!customerId) return res.status(401).json({ message: "Unauthorized" });

    const order = await populateOrder(Order.findOne({ _id: id, customerId }));
    if (!order) return res.status(404).json({ message: "Order not found or access denied" });

    return res.status(200).json({ message: "✅ Order retrieved successfully", ...orderResponse(order) });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get order", error: error.message });
  }
};

// ======================= CUSTOMER CREATE ORDER =======================
export const createCustomerOrder = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) {
      return res.status(401).json({ message: "❌ Unauthorized: customer not found in token" });
    }

    const {
      carInfo: carId,
      quantity = 1,
      paymentMethod,
      bankDetails,
      deposit: reqDeposit,
      paymentType = "full",
      ...rest
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "❌ Car not found" });

    const registrationFee = 500;
    const insuranceFee = 300;
    const taxRate = 0.1;
    const carSubtotal = car.price * quantity;
    const tax = carSubtotal * taxRate;
    const fullPrice = Math.round(carSubtotal + tax + registrationFee + insuranceFee);

    let depositAmount = 0;
    if (paymentType === "deposit") {
      if (!reqDeposit)
        return res.status(400).json({ message: "❌ Deposit amount is required" });

      const minDeposit = Math.round(0.3 * fullPrice);
      if (reqDeposit < minDeposit || reqDeposit > fullPrice) {
        return res.status(400).json({
          message: `❌ Deposit must be between 30% and 100% of totalPrice (${minDeposit} - ${fullPrice})`,
        });
      }
      depositAmount = reqDeposit;
    } else {
      depositAmount = fullPrice;
    }

    const payload = {
      ...rest,
      customerId,
      carInfo: carId,
      quantity,
      totalPrice: fullPrice,
      deposit: depositAmount,
      paymentType,
      paymentMethod,
      bankDetails: {},
      qrCodeUrl: "",
    };

    if (paymentMethod === "bank_transfer") {
      if (!bankDetails?.bankName || !bankDetails?.bankAccountNumber) {
        return res.status(400).json({
          message: "❌ Bank name and account number are required for bank transfer",
        });
      }
      payload.bankDetails = {
        bankName: bankDetails.bankName,
        bankAccountNumber: bankDetails.bankAccountNumber,
      };
    }

    if (paymentMethod === "qr") {
      if (!qrCodeUrl) {
        return res.status(400).json({ message: "❌ qrCodeUrl is required for QR payment" });
      }
      payload.qrCodeUrl = qrCodeUrl;
    }

    const newOrder = await Order.create(payload);
    const populatedOrder = await populateOrder(Order.findById(newOrder._id));

    return res.status(201).json({
      message: "✅ Order created successfully",
      ...orderResponse(populatedOrder),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "❌ Failed to create order", error: error.message });
  }
};

// ======================= CUSTOMER UPDATE PAYMENT METHOD =======================
const paymentConfigs = {
  cash: {},
  bank_transfer: {
    bankDetail: {
      bankName: "TPBank",
      accountNumber: "07200060908",
    },
  },
  qr: {
    qrUrl: "https://example.com/qrcode.png",
  },
};

export const updatePaymentMethodForCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const validMethods = ["cash", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const config = paymentConfigs[paymentMethod];
    if (!config) {
      return res.status(400).json({ message: "Payment method not available" });
    }

    order.paymentMethod = paymentMethod;
    order.paymentDetail = config;
    await order.save();

    res.json({ message: "Payment method updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================= CUSTOMER UPDATE DEPOSIT =======================
export const updateDepositForCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deposit } = req.body;

    if (typeof deposit !== "number" || deposit <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const minDeposit = 0.3 * order.totalPrice;
    if (
      deposit !== order.totalPrice &&
      (deposit < minDeposit || deposit > order.totalPrice)
    ) {
      return res.status(400).json({
        message: `🚫 Deposit must be at least 30% (${Math.round(minDeposit)}) of totalPrice or equal to totalPrice (${order.totalPrice})`,
      });
    }

    order.deposit = deposit;
    order.remainingAmount = order.totalPrice - deposit;
    await order.save();

    res.json({ message: "Deposit updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ======================= EXTRA =======================
export const calculateTotalPrice = (car, quantity, tax, registrationFee, insuranceFee, deposit = 0, paymentType = "full") => {
  const basePrice = car.price * quantity;
  const taxAmount = car.price * tax;
  const total = Math.round(basePrice + taxAmount + registrationFee + insuranceFee);

  if (paymentType === "deposit") {
    return {
      totalPrice: total,
      depositAmount: deposit,
      remainingAmount: total - deposit,
    };
  }
  return { totalPrice: total };
};

export const getAllOrderStatus = async (req, res) => {
  try {
    const orders = await Order.find({}, "status");
    res.json({ message: "✅ Order statuses fetched successfully", statuses: orders });
  } catch (error) {
    res.status(500).json({ message: "❌ Failed to fetch statuses", error: error.message });
  }
};

export const getAllOrderStatusConfirm = async (req, res) => {
  try {
    const orders = await Order.find({ status: "confirm" }, "status");
    res.json({ message: "✅ Confirmed order statuses fetched successfully", statuses: orders });
  } catch (error) {
    res.status(500).json({ message: "❌ Failed to fetch confirmed statuses", error: error.message });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, "name email");
    res.status(200).json({ message: "✅ Admins fetched successfully", data: admins });
  } catch (error) {
    res.status(500).json({ message: "❌ Failed to fetch admins", error: error.message });
  }
};

export const getAllOrdersForCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) return res.status(404).json({ message: "❌ Customer not found" });

    const orders = await Order.find({ customerId });
    return res.status(200).json({ message: "✅ Orders fetched successfully", data: orders });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get orders", error: error.message });
  }
};
export const getAllOrderStatusForCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id; // ✅ lấy từ JWT payload

    const orders = await Order.find(
      { customerId }, // lọc theo customerId từ token
      "status"        // chỉ lấy field status
    );

    res.json({
      message: "✅ Order statuses fetched successfully",
      statuses: orders.map(order => order.status),
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch statuses",
      error: error.message,
    });
  }
};
