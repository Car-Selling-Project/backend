import Order from "../models/orders.schema.js";
import Customer from "../models/customers.schema.js";
//Lấy danh sách hoá đơn + lọc theo ngày tháng + tính tổng doanh thu
export const getOrdersWithRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { status: "confirmed" };

    if (from && to) {
      match.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const orders = await Order.find(match)
      .populate("carInfo", "title brand model carType exteriorColor")
      .populate("customerId", "name")
      .populate("admin", "name");

    // Tổng doanh thu tất cả đơn
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Doanh thu theo paymentMethod
    const revenueByMethod = orders.reduce((acc, order) => {
      const method = order.paymentMethod || "unknown";
      acc[method] = (acc[method] || 0) + (order.totalPrice || 0);
      return acc;
    }, {});

    res.json({
      totalRevenue,
      revenueByMethod,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders with revenue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy danh sách xe đã bán + top xe bán chạy theo hãng + theo carType
export const getSoldCars = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { status: "confirmed" };

    if (from && to) {
      match.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

const soldCars = await Order.aggregate([
  { $match: match },
  {
    $lookup: {
      from: "cars",
      localField: "carInfo",
      foreignField: "_id",
      as: "car"
    }
  },
  { $unwind: "$car" },
  {
    $lookup: {
      from: "brands",
      localField: "car.brandId",
      foreignField: "_id",
      as: "brand"
    }
  },
  { $unwind: "$brand" },
  {
    $facet: {
      byCar: [
        {
          $group: {
            _id: "$car._id",
            title: { $first: "$car.title" },
            brand: { $first: "$brand.name" },
            model: { $first: "$car.model" },
            carType: { $first: "$car.carType" },
            exteriorColor: { $first: "$car.exteriorColor" },
            totalSold: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" }
          }
        },
        { $sort: { totalSold: -1 } }
      ],
      byBrand: [
        {
          $group: {
            _id: "$brand.name",
            totalSold: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" }
          }
        },
        { $sort: { totalSold: -1 } }
      ],
      byCarType: [
        {
          $group: {
            _id: "$car.carType",
            totalSold: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" }
          }
        },
        { $sort: { totalSold: -1 } }
      ]
    }
  }
]);
    res.json({
      totalCarsSold: soldCars[0].byCar.length,
      soldCars: soldCars[0].byCar,
      totalByBrand: soldCars[0].byBrand,
      totalByCarType: soldCars[0].byCarType
    });
  } catch (error) {
    console.error("Error fetching sold cars:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy danh sách Top Sale
export const getTopSalesAdmins = async (req, res) => {
  try {
    const { from, to, limit = 5 } = req.query;

    const match = { status: "confirmed" };
    if (from && to) {
      match.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const topAdmins = await Order.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "admins",
          localField: "admin",
          foreignField: "_id",
          as: "admin"
        }
      },
      { $unwind: "$admin" },
      {
        $group: {
          _id: "$admin.name", 
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json(topAdmins);
  } catch (error) {
    console.error("Error fetching top sales admins:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const countCustomers = async (req , res) => {
  try {
    const count = await Customer.countDocuments({});
    return res.json({ count });
  } catch (error) {
    console.error("Error counting customers:", error);
    res.status(500).json({ message: "Server error" });
  }
}
