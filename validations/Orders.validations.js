import Joi from 'joi';

const validPhonePrefixes = [
  '086','096','097','098','032','033','034','035','036','037','038','039',
  '088','091','094','083','084','085','081','082',
  '089','090','093','070','079','077','076','078',
  '092','056','058','099','059'
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

const orderValidationSchema = Joi.object({
  carInfo: Joi.string().hex().required().custom(noWhitespace('Car ID')),

  location: Joi.string().hex().required().custom(noWhitespace('Location ID')),

  totalPrice: Joi.number().integer().min(0).forbidden(),

  deposit: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .custom((value, helpers) => {
      const { totalPrice } = helpers.state.ancestors[0];
      if (!totalPrice) return value;
      if (value === 0) return value;
      const minDeposit = 0.3 * totalPrice;
      if (value === totalPrice || (value >= minDeposit && value < totalPrice)) {
        return value;
      }
      return helpers.message(
        `🚫 Deposit must be at least 30% (${Math.round(minDeposit)}) of totalPrice or equal to totalPrice (${totalPrice})`
      );
    }),

  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'qr').default('cash'),

  paymentType: Joi.string().valid('deposit', 'full').default('full'),

  paymentStatus: Joi.string()
    .valid('pending', 'deposited', 'paid', 'failed')
    .default('pending'),

  bankDetails: Joi.when('paymentMethod', {
    is: 'bank_transfer',
    then: Joi.object({
      bankName: Joi.string().required(),
      bankAccountNumber: Joi.string().required(),
    }).required(),
    otherwise: Joi.forbidden(),
  }),

  qrCodeUrl: Joi.when('paymentMethod', {
    is: 'qr',
    then: Joi.string().uri().required(),
    otherwise: Joi.forbidden(),
  }),

  customerInfo: Joi.object({
    fullName: Joi.string()
      .required()
      .custom(noWhitespace('Full name'))
      .pattern(nameRegex)
      .messages({
        'string.pattern.base': 'Full name must capitalize each word (e.g., Nguyễn Văn A)',
      }),

    phone: Joi.string().required().custom(noWhitespace('Phone number')).pattern(phoneRegex),

    email: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (value.includes(' ')) return helpers.message('Email must not contain spaces');
        if (value.includes('\n')) return helpers.message('Email must not contain new lines');
        if ((value.match(/@/g) || []).length > 1)
          return helpers.message('Email must not contain multiple @ characters');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return helpers.message('Invalid email format');
        return value;
      })
      .custom(noWhitespace('Email')),

    citizenId: Joi.string().required().custom(noWhitespace('Citizen ID')).pattern(citizenIdRegex),

    address: Joi.string().required().custom(noWhitespace('Address')),
  }).required(),

  contract: Joi.object({
    url: Joi.string().uri().optional(),
    signed: Joi.boolean().default(false),
    status: Joi.string()
      .valid('pending', 'pending_admin', 'not_signed', 'signed')
      .default('pending'),
  }).optional(),

  quantity: Joi.number().integer().min(1).required(),

  status: Joi.string()
    .valid('pending', 'confirmed', 'paid', 'canceled')
    .default('pending'),

  customerId: Joi.string().hex().required().custom(noWhitespace('Customer ID')),
});

export default orderValidationSchema;
