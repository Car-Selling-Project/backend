import rateLimit from 'express-rate-limit';

// Giới hạn: 10 requests / 5 phút
export const createCarLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: (req, res) => ({
    errors: [
      {
        key: "admin",
        message: "You are creating too many cars. Please slow down and try again later."
      }
    ]
  }),
  handler: (req, res, next, options) => {
    res.setHeader("Retry-After", 5 * 60);
    res.status(options.statusCode).json(options.message(req, res));
  }
});
export default createCarLimiter;