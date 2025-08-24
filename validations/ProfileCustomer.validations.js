import Joi from 'joi';
import dayjs from 'dayjs';

const currentYear = dayjs().year();
const minYear = currentYear - 75;
const maxYear = currentYear - 18;

const validPhonePrefixes = [
  '086','096','097','098','032','033','034','035','036','037','038','039',
  '088','091','094','083','084','085','081','082',
  '089','090','093','070','079','077','076','078',
  '092','056','058',
  '099','059'
];

const nameRegex = /^\p{Lu}\p{Ll}*(\s\p{Lu}\p{Ll}*)*$/u;
const phoneRegex = new RegExp(`^(${validPhonePrefixes.join('|')})\\d{7}$`);
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)(?!.*;)[A-Za-z\d!@#$%^&*]{5,32}$/;
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

function capitalizeWords(str) {
  return str
    .normalize('NFC')
    .trim()
    .split(/\s+/)
    .map(word =>
      word.charAt(0).toLocaleUpperCase('vi-VN') +
      word.slice(1).toLocaleLowerCase('vi-VN')
    )
    .join(' ');
};

export const profileSchema = Joi.object({
  name: Joi.string()
    .required()
    .custom((value, helpers) => {
      const formatted = capitalizeWords(value);
      if (!nameRegex.test(formatted)) {
        return helpers.message(
          'Name must start with capital letters and contain no numbers or special characters'
        );
      }
      return formatted;
    })
    .messages({
      'string.empty': 'Name is required',
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

  phone: Joi.string()
    .pattern(phoneRegex)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number is invalid or has an incorrect prefix'
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.pattern.base': 'Password must be 5–32 characters, include at least one special character and one digit, and must not contain the semicolon (;) character, must include 1 capitalized character'
    }),

  dob: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      const year = dayjs(value).year();
      if (year < minYear || year > maxYear) {
        return helpers.message(`Age must be between 18 and 75 years old (${minYear} - ${maxYear})`);
      }
      return value;
    })
    .messages({
      'date.base': 'Date of birth is invalid',
      'date.empty': 'Date of birth is required',
      'date.format': 'Date of birth must be in ISO format (yyyy-mm-dd)'
    }),

  gender: Joi.string()
    .trim()
    .valid('male', 'female', 'other')
    .required(),

  citizenId: Joi.string()
    .required()
    .pattern(citizenIdRegex)
    .custom(noWhitespace('Citizen ID'))
    .messages({
      'string.empty': 'Citizen ID is required',
      'string.pattern.base': 'Citizen ID must start with 0 and contain exactly 12 digits only',
    }),

  address: Joi.string()
    .required()
    .custom(noWhitespace('Address'))
    .messages({
      'string.empty': 'Address is required'
    }),
});
