import rateLimit from "express-rate-limit";
export const registerRateLimiter = rateLimit({
    windowMs: 5*60*1000,
    max:5,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req, res) => {
        return{
            errors: [
                {
                    key: "ip",
                    message: 'Bạn đã đăng ký quá 5 lần trong 5 phút. Vui lòng thử lại sau 10 phút.'
                }
            ]
        };
    },
    handler: (req , res , next , options) =>{
        // Chặn request và trả về lỗi
        res.setHeader('Retry-After' , 10 * 60);
        res.status(options.statusCode).json(options.message(req, res));
    },
    skipSuccessfulRequests:false,
});