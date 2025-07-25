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
                    message: 'You have registered more than 5 times in 5 minutes. Please try again after 10 minutes.'
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