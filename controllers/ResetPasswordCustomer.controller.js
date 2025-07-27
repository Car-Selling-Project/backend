import Customer from "../models/customers.schema.js";
import bcrypt from "bcrypt";

/**
 * ✅ Hàm 1: Kiểm tra email có tồn tại và lưu vào session
 */
export const checkEmailExists = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email does not exist" });
    }

    // ✅ Lưu email vào session
    req.session.email = email;

    return res.status(200).json({ message: "Email exists" });
  } catch (err) {
    console.error("Check Email Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ✅ Hàm 2: Reset mật khẩu – KHÔNG cần truyền lại email
 */
export const resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  try {
    // ✅ Lấy email từ session
    const email = req.session.email;

    if (!email) {
      return res.status(400).json({ message: "No verified email in session" });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Password and confirmPassword are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    user.password = password;
    await user.save();

    // ✅ Xoá email khỏi session sau khi reset xong
    req.session.email = null;

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
