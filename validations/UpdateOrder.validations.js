import Joi from 'joi';

const validPhonePrefixes = [
  '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039',
  '088', '091', '094', '083', '084', '085', '081', '082',
  '089', '090', '093', '070', '079', '077', '076', '078',
  '092', '056', '058', '099', '059'
];

const nameRegex = /^\p{Lu}\p{Ll}*(\s\p{Lu}\p{Ll}*)*$/u;
const phoneRegex = new RegExp(`^(${validPhonePrefixes.join('|')})\\d{7}$`);
const citizenIdRegex = /^0\d{11}$/;

const noWhitespace = (fieldName) => (value, helpers) => {
  if (typeof value !== 'string') return value;
  if (value.trim() !== value) {
    return helpers.message(`${fieldName} must not have leading or trailing spaces`);
  }
  if (value.includes('\n')) {
    return helpers.message(`${fieldName} must not contain new lines`);
  }
  return value;
};

const updateOrderValidationSchema = Joi.object({
  carInfo: Joi.string()
    .hex()
    .custom(noWhitespace('Car ID'))
    .messages({
      'string.hex': 'Car ID must be a valid hex string'
    }),

  location: Joi.string()
    .hex()
    .custom(noWhitespace('Location ID'))
    .messages({
      'string.hex': 'Location ID must be a valid hex string'
    }),

  deposit: Joi.number().integer().min(0),

  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'loan'),

  totalPrice: Joi.number().integer().min(0),
  customerId:Joi.string()
    .hex()
    .custom(noWhitespace('Customer ID'))
    .messages({
      'string.hex': 'Customer ID must be a valid hex string'
    }),
  customerInfo: Joi.object({
    fullName: Joi.string()
      .custom(noWhitespace('Full name'))
      .pattern(nameRegex)
      .messages({
        'string.pattern.base': 'Full name must capitalize each word (e.g., Nguyễn Văn A)'
      }),

    phone: Joi.string()
      .custom(noWhitespace('Phone number'))
      .pattern(phoneRegex)
      .messages({
        'string.pattern.base': 'Phone number must be a valid Vietnamese format'
      }),

    email: Joi.string()
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
      .custom(noWhitespace('Email')),

    citizenId: Joi.string()
      .custom(noWhitespace('Citizen ID'))
      .pattern(citizenIdRegex)
      .messages({
        'string.pattern.base': 'Citizen ID must start with 0 and contain exactly 12 digits only'
      }),

    address: Joi.string()
      .custom(noWhitespace('Address'))
  }),

  contract: Joi.object({
    url: Joi.string().uri(),
    signed: Joi.boolean()
  }),

  status: Joi.string().valid('pending', 'confirmed', 'canceled')
}).min(1); // ensure at least 1 field is provided
export default updateOrderValidationSchema