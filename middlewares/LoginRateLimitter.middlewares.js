import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 20, // Tối đa 5 lần
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => {
    return {
      errors: [
        {
          key: "ip",
          message: "You have attempted to login more than 5 times in 5 minutes. Please try again after 10 minutes.",
        },
      ],
    };
  },
  handler: (req, res, next, options) => {
    res.setHeader("Retry-After", 10 * 60); // 10 phút
    res.status(options.statusCode).json(options.message(req, res));
  },
  skipSuccessfulRequests: false, // Tính cả login thành công
});
