import Customer from "../models/customers.schema.js";
import bcrypt from "bcrypt";

export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Bước 1: Kiểm tra user tồn tại
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email does not exist" });
    }

    // ✅ Bước 2: So sánh mật khẩu mới với mật khẩu cũ
    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    // ✅ Bước 3: Gán mật khẩu mới (pre-save sẽ tự hash)
    user.password = password;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
