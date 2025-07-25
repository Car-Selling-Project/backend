import Joi from "joi";

// Regex cho employeeCode: Bắt đầu bằng "AD", theo sau là 4 chữ số, không chứa khoảng trắng, không xuống dòng, không ký tự đặc biệt, không chữ cái khác
const employeeCodeRegex = /^AD\d{4}$/;

// Regex cho password:
// - 5-32 ký tự
// - Ít nhất 1 chữ in hoa
// - Ít nhất 1 chữ số
// - Ít nhất 1 ký tự đặc biệt (trừ dấu chấm, phẩy)
// - Không có khoảng trắng, không xuống dòng
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:<>,.?/~`|\\]).{5,32}$/;

const loginAdminSchema = Joi.object({
  employeeCode: Joi.string()
    .pattern(employeeCodeRegex)
    .required()
    .messages({
      "string.empty": "Employee code is required",
      "string.pattern.base": "Employee code must start with 'AD' followed by 4 digits (e.g., AD1234)",
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .custom((value, helpers) => {
      if (/\s/.test(value)) {
        return helpers.error("any.invalid");
      }
      if (value.includes("\n")) {
        return helpers.error("any.invalid");
      }
      if (/[;,]/.test(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "No spaces, newlines, or semicolon/comma")
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 5–32 characters, include at least 1 uppercase letter, 1 digit, and 1 special character (excluding ; , .)",
      "any.invalid": "Password must not contain whitespace, newline, or ; , . characters",
    }),
});

export default loginAdminSchema;
