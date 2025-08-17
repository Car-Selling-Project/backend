import Order from "../models/orders.schema.js";
import Car from "../models/cars.schema.js";

// Helper populate
const populateOrder = (query) =>
  query
    .populate("admin", "name email")
    .populate("carInfo", "title price stock")
    .populate("location", "name")
    .populate("customerId", "name email phone");

// Helper response
const orderResponse = (order) => ({
  id: order._id,
  data: order,
  customer: order.customerId
    ? { id: order.customerId._id, name: order.customerId.name }
    : null,
});

// Create Order
export const createOrder = async (req, res) => {
  try {
    const adminId = req.admin?._id;

    const {
      carInfo: carId,
      quantity = 1,
      paymentMethod,
      bankDetails,
      qrCodeUrl,
      deposit: reqDeposit,
      ...rest
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "❌ Car not found" });

    const registrationFee = 500;
    const insuranceFee = 300;
    const taxRate = 0.1; // 10%

    // ✅ Nhân tax với tổng giá trị car * quantity
    const carSubtotal = car.price * quantity;
    const tax = carSubtotal * taxRate;

    const fullPrice = Math.round(carSubtotal + tax + registrationFee + insuranceFee);

    // ✅ Kiểm tra deposit
    let depositAmount = 0;
    if (paymentMethod === "deposit") {
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
      depositAmount = fullPrice; // full payment
    }

    // ✅ Khởi tạo payload
    const payload = {
      ...rest,
      admin: adminId,
      carInfo: carId,
      quantity,
      totalPrice: fullPrice,
      deposit: depositAmount,
      paymentMethod,
      bankDetails: {},
      qrCodeUrl: "",
    };

    // ✅ Kiểm tra thêm theo phương thức thanh toán
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

    // ✅ Tạo order
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

// Get All Orders (admin)
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
      limit = 20
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
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), count: orders.length }
    });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get orders", error: error.message });
  }
};

// Get Order by ID
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

// Update Order
export const updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await populateOrder(
      Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
    );
    if (!updatedOrder) return res.status(404).json({ message: "❌ Order not found" });
    return res.status(200).json({ message: "✅ Order updated successfully", ...orderResponse(updatedOrder) });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to update order", error: error.message });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Kiểm tra deposit
    const hasDeposit = order.deposit && order.deposit > 0;

    // Kiểm tra thanh toán đầy đủ (dựa trên deposit hoặc tổng các khoản thanh toán)
    const isPaidFull = order.deposit >= order.totalPrice; // thay bằng logic tổng các khoản nếu cần

    // Kiểm tra hợp đồng đã ký
    const contractSigned = Boolean(order.contract?.signed);

    // Nếu tất cả điều kiện đạt
    if (hasDeposit && isPaidFull && contractSigned) {
      order.status = "confirmed";
      order.paymentStatus = "confirmed";
      await order.save();

      return res.status(200).json({
        message: "Order confirmed successfully",
        order
      });
    } else {
      // Nếu còn thiếu điều kiện
      return res.status(200).json({
        message: "Order still pending, missing required conditions",
        missing: {
          deposit: !hasDeposit,
          paidFull: !isPaidFull,
          contractSigned: !contractSigned
        },
        order
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// Cancel Order
export const canceledOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ message: "Only pending orders can be canceled" });

    order.status = "canceled";
    await order.save();

    res.status(200).json({ message: "🚫 Order canceled successfully", order });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get Orders for Customer (with optional status)
export const getOrdersForCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) return res.status(401).json({ message: "Unauthorized" });

    const { status } = req.query;
    const filter = { customerId, ...(status ? { status } : {}) };

    const orders = await populateOrder(Order.find(filter));

    res.status(200).json({ message: `✅ Orders retrieved successfully${status ? ` with status ${status}` : ""}`, data: orders });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get orders", error: error.message });
  }
};

// Get single Order by ID for Customer
export const getOrderByIdForCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?._id;
    if (!customerId) return res.status(401).json({ message: "Unauthorized" });

    const order = await populateOrder(Order.findOne({ _id: id, customerId }));
    if (!order) return res.status(404).json({ message: "Order not found or access denied" });

    return res.status(200).json({ message: "✅ Order retrieved successfully", data: order });
  } catch (error) {
    return res.status(500).json({ message: "❌ Failed to get order", error: error.message });
  }
};
// Tính tổng tiền (full cash hoặc deposit)
export const calculateTotalPrice = (car, quantity, tax, registrationFee, insuranceFee, deposit = 0, paymentMethod = "full") => {
  const basePrice = car.price * quantity;
  const taxAmount = car.price * tax;
  const total = Math.round(basePrice + taxAmount + registrationFee + insuranceFee);

  if (paymentMethod === "deposit") {
    return {
      totalPrice: total,
      depositAmount: deposit,
      remainingAmount: total - deposit
    };
  }

  return { totalPrice: total };
};

// ✅ API cập nhật phương thức thanh toán cho Customer
export const updatePaymentMethodForCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const validMethods = ["cash", "bank_transfer", "qr"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Tìm order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Lấy config cứng từ code
    const config = paymentConfigs[paymentMethod];
    if (!config) {
      return res.status(400).json({ message: "Payment method not available" });
    }

    // Gắn thông tin vào order
    order.paymentMethod = paymentMethod;
    order.paymentDetail = config;

    await order.save();

    res.json({
      message: "Payment method updated successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ API cập nhật số tiền cọc cho Customer (có tính remainingAmount)
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
        message: `🚫 Deposit must be at least 30% (${Math.round(minDeposit)}) of totalPrice or equal to totalPrice (${order.totalPrice})`
      });
    }

    // Gán deposit & remainingAmount
    order.deposit = deposit;
    order.remainingAmount = order.totalPrice - deposit;

    await order.save();

    res.json({
      message: "Deposit updated successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
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



const paymentConfigs = {
  cash: {},
  bank_transfer: {
    bankDetail: {
      bankName: "TPBank",
      accountNumber: "07200060908",
    }
  },
  qr: {
    qrUrl: "https://example.com/qrcode.png"
  }
};

