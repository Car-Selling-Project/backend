import Admin from '../models/admins.schema.js';

const generateEmployeeCode = async () => {
  const count = await Admin.countDocuments();
  return `AD${(count + 1).toString().padStart(4, '0')}`;
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, dob, gender } = req.body;

    // Kiểm tra confirmPassword có khớp không
    if (password !== confirmPassword) {
      return res.status(400).json({
        errors: [{ key: 'confirmPassword', message: 'Confirm password does not match' }],
      });
    }

    // Check trùng email & phone
    const [emailExists, phoneExists] = await Promise.all([
      Admin.findOne({ email }),
      Admin.findOne({ phone }),
    ]);

    if (emailExists) {
      return res.status(400).json({
        errors: [{ key: 'email', message: 'Email already exists' }],
      });
    }

    if (phoneExists) {
      return res.status(400).json({
        errors: [{ key: 'phone', message: 'Phone already exists' }],
      });
    }

    // Sinh mã nhân viên
    const employeeCode = await generateEmployeeCode();

    // Tạo admin mới (giả sử password đã được hash từ middleware)
    const newAdmin = new Admin({
      employeeCode,
      name,
      email,
      phone,
      password,
      dob,
      gender,
    });

    await newAdmin.save();

    return res.status(201).json({
      message: 'Admin created successfully',
      adminId: newAdmin._id,
      employeeCode: newAdmin.employeeCode,
    });
  } catch (err) {
    console.error('[CreateAdmin]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
