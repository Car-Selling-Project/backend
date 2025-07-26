import dotenv from 'dotenv';
dotenv.config();

import Customer from '../models/customers.schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN;

export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate input
    const errors = [];
    if (!email) {
      errors.push({ key: 'email', message: 'Email is required' });
    }
    if (!password) {
      errors.push({ key: 'password', message: 'Password is required' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // ✅ Check if customer exists
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ message: 'Email does not exist' });
    }

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // ✅ Generate tokens
    const payload = {
      id: customer._id,
      role: 'customer',
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: '3h',
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });

    // ✅ Return response
    return res.status(200).json({
      message: {
        key: 'login',
        message: 'Login successful',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      errors: [
        {
          key: 'server',
          message: 'An unexpected error occurred during login',
        },
      ],
    });
  }
};
