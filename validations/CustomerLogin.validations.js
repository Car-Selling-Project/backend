import Joi from "joi";

export const loginCustomersSchema = Joi.object({
  email: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (value.includes(' ')) {
        return helpers.message("Email must not contain spaces");
      }
      if (value.includes('\n')) {
        return helpers.message("Email must not contain new lines");
      }
      if ((value.match(/@/g) || []).length > 1) {
        return helpers.message("Email must not contain multiple @ characters");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return helpers.message("Invalid email format");
      }
      return value;
    })
    .messages({
      'string.empty': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .min(5)
    .max(32)
    .custom((value, helpers) => {
      if (value.includes(' ')) {
        return helpers.message("Password must not contain spaces");
      }
      if (value.includes('\n')) {
        return helpers.message("Password must not contain new lines");
      }
      if (!/[A-Z]/.test(value)) {
        return helpers.message("Password must include at least one uppercase letter");
      }
      if (!/[0-9]/.test(value)) {
        return helpers.message("Password must include at least one digit");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{}:"\\|,<>\?/`~]/.test(value)) {
        return helpers.message("Password must include at least one special character (excluding semicolon)");
      }
      if (value.includes(";")) {
        return helpers.message("Password must not contain semicolons");
      }
      return value;
    })
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 5 characters long',
      'string.max': 'Password must not exceed 32 characters',
    })
});
