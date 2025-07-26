import Joi from "joi";

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .required()
    .custom((value, helpers) => {
      // Kiểm tra từng trường hợp cụ thể theo đúng thứ tự
      if (typeof value !== "string") {
        return helpers.message(`"email" must be a string`);
      }
      if (value.includes('\n')) {
        return helpers.message("Email must not contain new lines");
      }
      if (value.includes(' ')) {
        return helpers.message("Email must not contain spaces");
      }
      if ((value.match(/@/g) || []).length > 1) {
        return helpers.message("Email must not contain multiple @ characters");
      }
      return value;
    })
    .messages({
      "string.empty": `"email" is required`,
      "string.base": `"email" must be a string`,
    }),

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
