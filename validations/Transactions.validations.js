import Joi from "joi";

const validPhonePrefixes = [
  '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039',
  '088', '091', '094', '083', '084', '085', '081', '082',
  '089', '090', '093', '070', '079', '077', '076', '078',
  '092', '056', '058', '099', '059'
];

const nameRegex = /^\p{Lu}\p{Ll}*(\s\p{Lu}\p{Ll}*)*$/u;
const phoneRegex = new RegExp(`^(${validPhonePrefixes.join('|')})\\d{7}$`);
const citizenIdRegex = /^0\d{11}$/;

const noWhitespace = (value, helpers) => {
  if (typeof value !== 'string') return value;
  if (value.trim() !== value) {
    return helpers.message(`must not have leading or trailing spaces`);
  }
  if (value.includes('\n')) {
    return helpers.message(`must not contain new lines`);
  }
  return value;
};

export const transactionValidationSchema = Joi.object({
  order: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!Joi.string().regex(/^[0-9a-fA-F]{24}$/).validate(value).error) {
        return value;
      }
      return helpers.message("order must be a valid ObjectId");
    }),
  customerId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!Joi.string().regex(/^[0-9a-fA-F]{24}$/).validate(value).error) {
        return value;
      }
      return helpers.message("customerId must be a valid ObjectId");
    }),
  customerInfo: Joi.object({
    fullName: Joi.string()
      .required()
      .custom(noWhitespace)
      .pattern(nameRegex)
      .messages({
        "string.pattern.base": "fullName format is invalid"
      }),
    phone: Joi.string()
      .required()
      .custom(noWhitespace)
      .pattern(phoneRegex)
      .messages({
        "string.pattern.base": "phone format is invalid"
      }),
    email: Joi.string().email().required(),
    citizenId: Joi.string()
      .required()
      .custom(noWhitespace)
      .pattern(citizenIdRegex)
      .messages({
        "string.pattern.base": "citizenId format is invalid"
      }),
    address: Joi.string()
      .required()
      .custom(noWhitespace)
  }).required(),
  amount: Joi.number().integer().min(0).required(),
  paymentMethod: Joi.string().valid("cash", "bank_transfer", "loan").required(),
  type: Joi.string().valid("deposit", "full_payment").required(),
  transactionCode: Joi.string().allow("").optional(),
  status: Joi.string().valid("success", "failed", "pending").optional(),
  receiptUrl: Joi.string().uri().allow("").optional(),
  confirmBy: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!Joi.string().regex(/^[0-9a-fA-F]{24}$/).validate(value).error) {
        return value;
      }
      return helpers.message("confirmBy must be a valid ObjectId");
    }),
});
