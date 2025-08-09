import Order from "../models/orders.schema.js";

export const getPurchaseDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};
    if (from && to) {
      match.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const stats = await Order.aggregate([
      { $match: { ...match, status: 'confirmed' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'carInfo',
          foreignField: '_id',
          as: 'car',
        },
      },
      { $unwind: '$car' },
      {
        $lookup: {
          from: 'brands',
          localField: 'car.brandId',
          foreignField: '_id',
          as: 'brand',
        },
      },
      { $unwind: '$brand' },
      {
        $facet: {
          totalRevenue: [{ $group: { _id: null, total: { $sum: '$totalPrice' } } }],
          totalCarsSold: [{ $count: 'count' }],
          ordersByStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          topSellingCars: [
            {
              $group: {
                _id: '$car._id',
                count: { $sum: 1 },
                model: { $first: '$car.model' },
                brand: { $first: '$brand.name' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
          revenueByPaymentMethod: [
            { $group: { _id: '$paymentMethod', total: { $sum: '$totalPrice' } } },
          ],
          revenueByCarType: [
            { $group: { _id: '$car.carType', total: { $sum: '$totalPrice' } } },
          ],
          revenueByBrand: [
            { $group: { _id: '$brand.name', total: { $sum: '$totalPrice' } } },
          ],
          revenueTrend: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                total: { $sum: '$totalPrice' },
              },
            },
            { $sort: { _id: 1 } },
          ],
          topAdmins: [
            {
              $group: {
                _id: '$admin',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'admins',          
                localField: '_id',
                foreignField: '_id',
                as: 'admin'
              }
            },
            { $unwind: '$admin' },
            {
              $project: {
                _id: 0,
                adminId: '$admin._id',
                name: '$admin.name',      
                count: 1
              }
            }
          ],
        },
      },
    ]);

    const data = stats[0];

    res.json({
      totalRevenue: data.totalRevenue[0]?.total || 0,
      totalCarsSold: data.totalCarsSold[0]?.count || 0,
      ordersByStatus: data.ordersByStatus.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
      topSellingCars: data.topSellingCars,
      revenueByPaymentMethod: data.revenueByPaymentMethod.map(r => ({
        method: r._id,
        total: r.total,
      })),
      revenueByCarType: data.revenueByCarType.map(r => ({
        type: r._id,
        total: r.total,
      })),
      revenueByBrand: data.revenueByBrand.map(r => ({
        brand: r._id,
        total: r.total,
      })),
      revenueTrend: data.revenueTrend.map(r => ({
        date: r._id,
        total: r.total,
      })),
      topAdmins: data.topAdmins,
    });
  } catch (error) {
    console.error('Error fetching purchase dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
