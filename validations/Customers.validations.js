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

const nameRegex = /^[A-Z][a-zà-ỹ]*(\s[A-Z][a-zà-ỹ]*)*$/u;
const phoneRegex = new RegExp(`^(${validPhonePrefixes.join('|')})\\d{7}$`);
const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{5,32}$/;

export const customerSchema = Joi.object({
  name: Joi.string()
    .pattern(nameRegex)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên không được để trống',
      'string.pattern.base': 'Tên phải viết hoa chữ cái đầu, không số, không ký tự đặc biệt, không xuống dòng',
      'string.max': 'Tên không vượt quá 100 ký tự'
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .pattern(/^[^\s\n]+@[^\s\n]+\.[^\s\n]+$/)
    .messages({
      'string.empty': 'Email không được để trống',
      'string.pattern.base': 'Email không chứa khoảng trắng hoặc xuống dòng',
      'string.email': 'Email không đúng định dạng'
    }),

  phone: Joi.string()
    .pattern(phoneRegex)
    .required()
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ hoặc không đúng đầu số'
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.pattern.base': 'Mật khẩu từ 5-32 ký tự, ít nhất 1 ký tự đặc biệt, 1 chữ số, không khoảng trắng, không xuống dòng'
    }),

  confirmPassword: Joi.any()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu không được để trống'
    }),

  dob: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      const year = dayjs(value).year();
      if (year < minYear || year > maxYear) {
        return helpers.message(`Tuổi phải từ 18 đến dưới 75 (${minYear} - ${maxYear})`);
      }
      return value;
    })
    .messages({
      'date.base': 'Ngày sinh không hợp lệ',
      'date.empty': 'Ngày sinh không được để trống',
      'date.format': 'Ngày sinh không đúng định dạng ISO (yyyy-mm-dd)'
    }),

  gender: Joi.string()
    .valid('nam', 'nữ', 'khác')
    .required()
    .messages({
      'any.only': 'Giới tính phải là nam, nữ hoặc khác',
      'string.empty': 'Giới tính không được để trống'
    })
});
