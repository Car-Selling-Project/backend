import rateLimit from "express-rate-limit";

export const resetPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // ⏳ 5 phút
  max: 300, // ❌ tối đa 5 lần reset/password trong 5 phút
  message: {
    message: "Too many password reset attempts. Please try again later.",
  },
  standardHeaders: true, // Gửi rate limit info qua header
  legacyHeaders: false,
});
