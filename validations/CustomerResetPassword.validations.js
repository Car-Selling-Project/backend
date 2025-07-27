import Joi from "joi";

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .required()
    .min(5)
    .max(32)
    .pattern(/[!@#$%^&*(),.?":{}|<>]/)
    .message("Password must contain at least one special character")
    .pattern(/[A-Z]/)
    .message("Password must contain at least one uppercase letter")
    .pattern(/[0-9]/)
    .message("Password must contain at least one number")
    .messages({
      "string.empty": `"password" is required`,
      "string.min": "Password must be at least 5 characters",
      "string.max": "Password must be at most 32 characters",
    }),

  confirmPassword: Joi.any()
    .required()
    .valid(Joi.ref("password"))
    .messages({
      "any.only": "Confirm password does not match password",
      "any.required": `"confirmPassword" is required`,
    }),
});

export default resetPasswordSchema;
