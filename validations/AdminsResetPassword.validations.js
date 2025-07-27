import Joi from "joi";

const resetPasswordAdminSchema = Joi.object({
  password: Joi.string()
    .required()
    .min(5)
    .max(32)
    .custom((value, helpers) => {
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return helpers.message("Password must contain at least one special character");
      }
      if (!/[A-Z]/.test(value)) {
        return helpers.message("Password must contain at least one uppercase letter");
      }
      if (!/[0-9]/.test(value)) {
        return helpers.message("Password must contain at least one number");
      }
      if (value.includes(";")) {
        return helpers.message("Password must not contain the semicolon (;)"); 
      }
      return value;
    })
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 5 characters",
      "string.max": "Password must be at most 32 characters",
    }),

  confirmPassword: Joi.valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Confirm password does not match password",
      "any.required": "Confirm password is required",
    }),
});

export default resetPasswordAdminSchema;
