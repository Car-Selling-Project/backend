import Joi from 'joi';
import dayjs from 'dayjs';

const validPhonePrefixes = [
  '086','096','097','098','032','033','034','035','036','037','038','039',
  '088','091','094','083','084','085','081','082',
  '089','090','093','070','079','077','076','078',
  '092','056','058','099','059'
];

const nameRegex = /^[A-Z][a-zà-ỹ]*(\s[A-Z][a-zà-ỹ]*)*$/u;
const phoneRegex = new RegExp(`^(${validPhonePrefixes.join('|')})\\d{7}$`);
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)(?!.*;)[A-Za-z\d!@#$%^&*]{5,32}$/;


const minYear = dayjs().year() - 75;
const maxYear = dayjs().year() - 18;

export const adminSchema = Joi.object({
  name: Joi.string().pattern(nameRegex).required().messages({
    'string.empty': 'Name is required',
    'string.pattern.base': 'Name must start with a capital letter, contain no numbers or special characters',
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
  .messages({
    'string.empty': 'Email is required',
  }),


  phone: Joi.string().pattern(phoneRegex).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Phone number is invalid or has an incorrect prefix',
  }),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.empty': 'Password is required',
    'string.pattern.base':
      'Password must be 5–32 characters, include at least one special character and one digit, and must not contain the semicolon (;)',
  }),
  confirmPassword: Joi.valid(Joi.ref('password')).required().messages({
    'any.only': 'Confirm password does not match',
    'any.required': 'Confirm password is required',
  }),
  dob: Joi.date().iso().required().custom((value, helpers) => {
    const year = dayjs(value).year();
    if (year < minYear || year > maxYear) {
      return helpers.message(`Age must be between 18 and 75 years old (${minYear} - ${maxYear})`);
    }
    return value;
  }).messages({
    'date.base': 'Date of birth is invalid',
    'date.empty': 'Date of birth is required',
    'date.format': 'Date of birth must be in ISO format (yyyy-mm-dd)',
  }),
  gender: Joi.string().trim().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be one of: male, female, or other',
    'string.empty': 'Gender is required',
  }),
});
