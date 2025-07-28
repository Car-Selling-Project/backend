import Joi from "joi";

const unifiedErrorMessage = "Email or password is wrong";

export const loginCustomersSchema = Joi.object({
  email: Joi.string()
    .required()
    .custom((value, helpers) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        value.includes(" ") ||
        value.includes("\n") ||
        (value.match(/@/g) || []).length > 1 ||
        !emailRegex.test(value)
      ) {
        return helpers.message(unifiedErrorMessage);
      }
      return value;
    })
    .messages({
      "string.empty": unifiedErrorMessage,
    }),

  password: Joi.string()
    .required()
    .min(5)
    .max(32)
    .custom((value, helpers) => {
      const hasUppercase = /[A-Z]/.test(value);
      const hasDigit = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}:"\\|,<>\?/`~]/.test(value);

      if (
        value.includes(" ") ||
        value.includes("\n") ||
        value.includes(";") ||
        !hasUppercase ||
        !hasDigit ||
        !hasSpecial
      ) {
        return helpers.message(unifiedErrorMessage);
      }
      return value;
    })
    .messages({
      "string.empty": unifiedErrorMessage,
      "string.min": unifiedErrorMessage,
      "string.max": unifiedErrorMessage,
    }),
});
