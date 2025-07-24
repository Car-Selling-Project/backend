import Customer from "../models/customers.schema.js";

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, dob, gender } = req.body;

    // ✅ 1. Check missing fields
    if (!name || !email || !phone || !password || !confirmPassword || !dob || !gender) {
      return res.status(400).json({
        errors: [
          {
            key: "global",
            message: "Vui lòng nhập đầy đủ tất cả các trường",
          },
        ],
      });
    }

    // ✅ 2. Check confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({
        errors: [
          {
            key: "confirmPassword",
            message: "Mật khẩu và xác nhận mật khẩu không khớp",
          },
        ],
      });
    }

    // ✅ 3. Check trùng email
    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        errors: [
          {
            key: "email",
            message: "Email đã được sử dụng",
          },
        ],
      });
    }

    // ✅ 4. Check trùng số điện thoại
    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        errors: [
          {
            key: "phone",
            message: "Số điện thoại đã được sử dụng",
          },
        ],
      });
    }

    // ✅ 5. Map gender tiếng Việt → tiếng Anh
    const genderMap = {
      nam: 'male',
      nữ: 'female',
      khác: 'other'
    };

    const mappedGender = genderMap[gender.toLowerCase().trim()];
    if (!mappedGender) {
      return res.status(400).json({
        errors: [
          {
            key: "gender",
            message: "Giới tính không hợp lệ",
          },
        ],
      });
    }

    // ✅ 6. Tạo customer (hash xử lý ở pre-save mongoose)
    const newCustomer = new Customer({
      name,
      email,
      phone,
      password,
      dob,
      gender: mappedGender
    });

    await newCustomer.save();

    res.status(201).json({
      message: "Đăng ký thành công",
      customerId: newCustomer._id,
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      errors: [
        {
          key: "server",
          message: "Đã xảy ra lỗi khi đăng ký",
        },
      ],
    });
  }
};
