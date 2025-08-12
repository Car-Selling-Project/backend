import TestDrive from "../models/testdrives.schema.js";
export const createTestDrive = async(req , res) => {
    try{
        const adminId = req.admin?._id;
        const payload = {
            ...req.body,
            admin:adminId
        };
        const newTestDrive = await TestDrive.create(payload);
        const populateTestDrive = await TestDrive.findById(newTestDrive._id)
        .populate("admin" , "name")
        .populate(
            {
                path:"carInfo",
                select:"title brandId model exteriorColor carType",
                populate:{
                    path:"brandId",
                    select:"name"
                },
            },
        )
        .populate("location" , "name")
        .populate("customerInfo" , "fullName phone email citizenId address");
        return res.status(201).json({
            message: "✅ Test Drive created successfully",
            data: populateTestDrive,
            customer: populateTestDrive.customerId
            ?{ id: populateTestDrive.customerId._id}
            : null
        });
    }catch (error){
        return res.status(500).json({
            message: "❌ Failed to create TestDrive",
            error: error.message,
        })
    }
}
export const approveTestDrive = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy testDrive và populate carInfo.status để check xe active
    const testDrive = await TestDrive.findById(id).populate("carInfo", "status");
    if (!testDrive) {
      return res.status(404).json({ message: "Test Drive not found" });
    }

    // Chỉ cho phép thay đổi khi status đang là pending
    if (testDrive.status !== "pending") {
      return res.status(400).json({
        message: `Cannot change status because test drive is already "${testDrive.status}"`,
      });
    }

    if (!testDrive.carInfo || testDrive.carInfo.status !== "active") {
      return res.status(400).json({
        message: "Car is not active, cannot approve test drive",
      });
    }

    // Kiểm tra lịch trùng với các test drive khác đã approved
    const overlappingTestDrive = await TestDrive.findOne({
      _id: { $ne: testDrive._id },
      carInfo: testDrive.carInfo._id,
      status: "approved",
      $or: [
        {
          requestDay: { $lt: testDrive.endDay, $gte: testDrive.requestDay },
        },
        {
          endDay: { $gt: testDrive.requestDay, $lte: testDrive.endDay },
        },
        {
          requestDay: { $lte: testDrive.requestDay },
          endDay: { $gte: testDrive.endDay },
        },
      ],
    });

    if (overlappingTestDrive) {
      testDrive.status = "declined";
      await testDrive.save();
      return res.status(400).json({
        message:
          "Test Drive declined due to overlapping schedule with another approved test drive",
        data: testDrive,
      });
    }

    // Kiểm tra điều kiện ngày tháng
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (
      testDrive.requestDay >= todayStart &&
      testDrive.endDay > testDrive.requestDay
    ) {
      testDrive.status = "approved";
      await testDrive.save();
      return res.status(200).json({
        message: "✅ Test Drive approved successfully",
        data: testDrive,
      });
    } else {
      testDrive.status = "declined";
      await testDrive.save();
      return res.status(400).json({
        message: "❌ Test Drive declined due to invalid requestDay or endDay",
        data: testDrive,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "❌ Internal server error",
      error: error.message,
    });
  }
};

// GET all approved test drives (admin)
export const getAllApprovedTestDrives = async (req, res) => {
  try {
    const approvedTestDrives = await TestDrive.find({ status: "approved" })
      .populate("admin", "name")
      .populate({
        path: "carInfo",
        select: "title brandId model exteriorColor carType status",
        populate: [
          { path: "brandId", select: "name" },
        ],
      })
      .populate("location", "name")
      .populate("customerId")
      .populate("customerInfo", "fullName phone email citizenId address");

    return res.status(200).json({
      message: "✅ Approved test drives retrieved successfully",
      data: approvedTestDrives,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get approved test drives",
      error: error.message,
    });
  }
};

// GET approved test drives by customerId
export const getApprovedTestDrivesByCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customerTestDrives = await TestDrive.find({
      customerId,
      status: "approved",
    })
      .populate("admin", "name")
      .populate({
        path: "carInfo",
        select: "title brandId model exteriorColor carType status",
        populate: [{ path: "brandId", select: "name" }],
      })
      .populate("location", "name")
      .populate("customerInfo", "fullName phone email citizenId address");

    return res.status(200).json({
      message: `✅ Approved test drives for customer ${customerId} retrieved successfully`,
      data: customerTestDrives,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get approved test drives for customer",
      error: error.message,
    });
  }
};


// DELETE test drive by id
export const deleteTestDrive = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TestDrive.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Test Drive not found" });
    }

    return res.status(200).json({
      message: "✅ Test Drive deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to delete test drive",
      error: error.message,
    });
  }
};
// get test drive id for admin
export const getTestDriveById = async (req, res) => {
  try {
    const { id } = req.params;

    const testDrive = await TestDrive.findById(id)
      .populate("admin", "name")
      .populate({
        path: "carInfo",
        select: "title brandId model status exteriorColor carType",
        populate: [
          { path: "brandId", select: "name" },
        ],
      })
      .populate("location", "name")
      .populate("customerInfo", "fullName phone email citizenId address");

    if (!testDrive) {
      return res.status(404).json({ message: "Test Drive not found" });
    }

    return res.status(200).json({
      message: "✅ Test Drive retrieved successfully",
      data: testDrive,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get test drive",
      error: error.message,
    });
  }
};
// 1. Lấy tất cả test drives của customer (ko phân biệt trạng thái)
export const getAllTestDrivesByCustomer = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const testDrives = await TestDrive.find({ customerId })
      .populate("admin", "name")
      .populate({
        path: "carInfo",
        select: "title brandId model exteriorColor carType status",
        populate: [{ path: "brandId", select: "name" }],
      })
      .populate("location", "name")
      .populate("customerInfo", "fullName phone email citizenId address");

    return res.status(200).json({
      message: `✅ All test drives for customer ${customerId} retrieved successfully`,
      data: testDrives,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get test drives for customer",
      error: error.message,
    });
  }
};

// 2. Lấy test drive theo id và kiểm tra customerId trùng khớp
export const getTestDriveByIdForCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?._id;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const testDrive = await TestDrive.findOne({ _id: id, customerId })
      .populate("admin", "name")
      .populate({
        path: "carInfo",
        select: "title brandId model exteriorColor carType status",
        populate: [{ path: "brandId", select: "name" }],
      })
      .populate("location", "name")
      .populate("customerInfo", "fullName phone email citizenId address");

    if (!testDrive) {
      return res.status(404).json({
        message: "Test Drive not found or you do not have permission to access",
      });
    }

    return res.status(200).json({
      message: "✅ Test Drive retrieved successfully",
      data: testDrive,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get test drive",
      error: error.message,
    });
  }
};