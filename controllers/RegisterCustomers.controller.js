import Customer from "../models/customers.schema.js";

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, dob, gender , citizenId, address } = req.body;

    // ✅ 1. Check missing fields
    if (!name || !email || !phone || !password || !confirmPassword || !dob || !gender || !citizenId || !address) {
      return res.status(400).json({
        errors: [
          {
            key: "global",
            message: "Please fill in all required fields",
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
            message: "Password and confirm password do not match",
          },
        ],
      });
    }

    // ✅ 3. Check duplicate email
    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        errors: [
          {
            key: "email",
            message: "Email is already in use",
          },
        ],
      });
    }

    // ✅ 4. Check duplicate phone
    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        errors: [
          {
            key: "phone",
            message: "Phone number is already in use",
          },
        ],
      });
    }

    // ✅ 5. Validate gender directly
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(gender.toLowerCase().trim())) {
      return res.status(400).json({
        errors: [
          {
            key: "gender",
            message: "Invalid gender",
          },
        ],
      });
    }
    // ✅ 6. Check duplicate citizenId
    const existingCitizenId = await Customer.findOne({ citizenId });
    if (existingCitizenId) {
      return res.status(400).json({
        errors: [
          {
            key: "citizenId",
            message: "Citizen ID is already in use",
          },
        ],
      });
    }
    // ✅ 7. Create customer (hash handled in mongoose pre-save)
    const newCustomer = new Customer({
      name,
      email,
      phone,
      password,
      dob,
      gender: gender.toLowerCase().trim(),
      citizenId,
      address
    });

    await newCustomer.save();

    res.status(201).json({
      message: "Registration successful",
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      errors: [
        {
          key: "server",
          message: "An error occurred during registration",
        },
      ],
    });
  }
};
