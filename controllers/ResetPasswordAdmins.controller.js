import Admin from "../models/admins.schema.js";
import bcrypt from "bcrypt";

export const resetAdminPassword = async (req, res) => {
  const { employeeCode, password } = req.body;

  try {
    // ✅ 1. Tìm admin theo employeeCode
    const admin = await Admin.findOne({ employeeCode });
    if (!admin) {
      return res.status(404).json({ message: "Employee code does not exist" });
    }

    // ✅ 2. So sánh password mới và password cũ
    const isSame = await bcrypt.compare(password, admin.password);
    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    // ✅ 3. Gán password mới (đã hash ở schema với pre('save'))
    admin.password = password;
    await admin.save();

    return res.status(200).json({
      message: "Admin password reset successful",
    });
  } catch (err) {
    console.error("Reset Admin Password Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
