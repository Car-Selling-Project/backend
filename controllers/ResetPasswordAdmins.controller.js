import Admin from "../models/admins.schema.js";
import bcrypt from "bcrypt";

/**
 * Bước 1: Kiểm tra employeeCode có tồn tại và lưu vào session
 */
export const checkEmployeeCodeExists = async (req, res) => {
  const { employeeCode } = req.body;

  try {
    if (!employeeCode) {
      return res.status(400).json({ message: "Employee code is required" });
    }

    const admin = await Admin.findOne({ employeeCode });
    if (!admin) {
      return res.status(404).json({ message: "Employee code does not exist" });
    }

    // ✅ Lưu vào session
    req.session.employeeCode = employeeCode;

    return res.status(200).json({ message: "Employee code exists" });
  } catch (err) {
    console.error("Check Employee Code Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Bước 2: Đổi mật khẩu - KHÔNG cần truyền lại employeeCode
 */
export const resetAdminPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  try {
    const employeeCode = req.session.employeeCode;

    if (!employeeCode) {
      return res.status(400).json({ message: "No verified employee code in session" });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "Password and confirmPassword are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const admin = await Admin.findOne({ employeeCode });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isSame = await bcrypt.compare(password, admin.password);
    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    admin.password = password;
    await admin.save();

    // ✅ Sau khi reset xong, xoá khỏi session để tránh dùng lại
    req.session.employeeCode = null;

    return res.status(200).json({
      message: "Admin password reset successful",
    });
  } catch (err) {
    console.error("Reset Admin Password Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
