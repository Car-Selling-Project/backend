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
        .populate("carInfo" , "-locationId")
        .populate("location" , "name");
        return res.status(201).json({
            message: "✅ Test Drive created successfully",
            data: populateTestDrive,
            customer: populateTestDrive.customerId
            ?{ id: populateTestDrive.customerId._id, name: populateTestDrive.customerId.name}
            : null
        });
    }catch (error){
        return res.status(500).json({
            message: "❌ Failed to create TestDrive",
            error: error.message,
        })
    }
}