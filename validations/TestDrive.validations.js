// validation/testDriveSchema.js
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

const validateRequestDay = (value, helpers) => {
  const now = new Date();

  if (value < now) {
    return helpers.message('Request day cannot be in the past');
  }

  const hour = value.getHours();
  if (hour < 12) {
    return helpers.message('Request time must be from 12:00 noon or later');
  }
  if (hour >= 22) {
    return helpers.message('Request time must be before 22:00 (10 PM)');
  }

  return value;
};

const testDriveSchema = Joi.object({
  carInfo: Joi.string()
    .hex()
    .required()
    .custom(noWhitespace('Car ID'))
    .messages({
      'string.empty': 'Car ID is required',
      'string.hex': 'Car ID must be a valid hex string'
    }),

  location: Joi.string()
    .hex()
    .required()
    .custom(noWhitespace('Location ID'))
    .messages({
      'string.empty': 'Location ID is required',
      'string.hex': 'Location ID must be a valid hex string'
    }),

  requestDay: Joi.date()
    .required()
    .custom(validateRequestDay)
    .messages({
      'date.base': 'Request day must be a valid date',
      'date.empty': 'Request day is required'
    }),

  note: Joi.string().optional(),

  customerId: Joi.string()
    .hex()
    .required()
    .custom(noWhitespace('Customer ID'))
    .messages({
      'string.empty': 'Customer ID is required',
      'string.hex': 'Customer ID must be a valid hex string'
    }),

  customerInfo: Joi.object({
    fullName: Joi.string()
      .required()
      .custom(noWhitespace('Full name'))
      .pattern(nameRegex)
      .messages({
        'string.empty': 'Full name is required',
        'string.pattern.base': 'Full name must capitalize each word (e.g., Nguyễn Văn A)'
      }),

    phone: Joi.string()
      .required()
      .custom(noWhitespace('Phone number'))
      .pattern(phoneRegex)
      .messages({
        'string.empty': 'Phone number is required',
        'string.pattern.base': 'Phone number must be a valid Vietnamese format'
      }),

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
      .custom(noWhitespace('Email'))
      .messages({
        'string.empty': 'Email is required',
      }),

    citizenId: Joi.string()
      .required()
      .custom(noWhitespace('Citizen ID'))
      .pattern(citizenIdRegex)
      .messages({
        'string.empty': 'Citizen ID is required',
        'string.pattern.base': 'Citizen ID must start with 0 and contain exactly 12 digits only'
      }),

    address: Joi.string()
      .required()
      .custom(noWhitespace('Address'))
      .messages({
        'string.empty': 'Address is required'
      })
  }).required(),

status: Joi.string()
  .valid('pending', 'approved', 'declined')
  .default('pending')
  .messages({
    'any.only': 'Status must be one of: pending, approved, declined'
  })
});

export default testDriveSchema;
