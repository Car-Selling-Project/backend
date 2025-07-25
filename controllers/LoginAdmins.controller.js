import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/admins.schema.js";

export const loginAdmin = async (req, res) => {
  const { employeeCode, password } = req.body;

  try {
    const admin = await Admin.findOne({ employeeCode });
    if (!admin) {
      return res.status(401).json({ message: "Employee code does not exist" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: [{ key: "password", message: "Password is incorrect" }],
      });
    }

    const accessToken = jwt.sign(
      {
        adminId: admin._id,
        employeeCode: admin.employeeCode,
      },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "3h" }
    );

    const refreshToken = jwt.sign(
      {
        adminId: admin._id,
        employeeCode: admin.employeeCode,
      },
      process.env.JWT_REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("❌ Login Admin error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
