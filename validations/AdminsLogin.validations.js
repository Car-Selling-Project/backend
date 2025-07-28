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
      "string.empty": "Employee code or password is wrong",
      "string.pattern.base": "Employee code or password is wrong",
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .custom((value, helpers) => {
      if (/\s/.test(value)) return helpers.error("any.invalid");
      if (value.includes("\n")) return helpers.error("any.invalid");
      if (/[;,]/.test(value)) return helpers.error("any.invalid");
      return value;
    }, "Custom password check")
    .messages({
      "string.empty": "Employee code or password is wrong",
      "string.pattern.base": "Employee code or password is wrong",
      "any.invalid": "Employee code or password is wrong",
    }),
});


export default loginAdminSchema;
