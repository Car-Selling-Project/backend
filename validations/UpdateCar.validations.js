import Joi from "joi";

export const updateCarSchema = Joi.object({
  title: Joi.string().optional().messages({
    "string.empty": "🚫 Car title cannot be empty"
  }),

  description: Joi.string().optional().messages({
    "string.empty": "🚫 Description cannot be empty"
  }),

  brandId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "🚫 brandId must be a valid ObjectId (hex)",
    "string.length": "🚫 brandId must be 24 characters long"
  }),

  locationId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "🚫 locationId must be a valid ObjectId (hex)",
    "string.length": "🚫 locationId must be 24 characters long"
  }),

  model: Joi.string().optional().messages({
    "string.empty": "🚫 Model cannot be empty"
  }),

  price: Joi.number().min(0).optional().messages({
    "number.base": "🚫 Price must be a number",
    "number.min": "🚫 Price must be at least 0"
  }),

  fuelType: Joi.string().valid("Gasoline", "Diesel", "Electric", "Hybrid").optional().messages({
    "any.only": "🚫 Invalid fuel type"
  }),

  tranmission: Joi.string().valid("Manual", "Automatic").optional().messages({
    "any.only": "🚫 Transmission must be Manual or Automatic"
  }),

  seat: Joi.number().integer().min(2).max(20).optional().messages({
    "number.base": "🚫 Seat must be a number",
    "number.min": "🚫 Must have at least 2 seats",
    "number.max": "🚫 Must have at most 20 seats",
    "number.integer": "🚫 Seat must be an integer"
  }),

  carType: Joi.string().valid("Sedan", "SUV", "Hatchback", "Pickup", "MPV").optional().messages({
    "any.only": "🚫 Invalid car type"
  }),

  exteriorColor: Joi.array().items(Joi.string().required()).min(1).optional().messages({
    "array.base": "🚫 Exterior color must be an array of strings",
    "array.min": "🚫 At least one color must be provided"
  }),

  registrationYear: Joi.number().integer().min(1986).max(new Date().getFullYear()).optional().messages({
    "number.base": "🚫 Registration year must be a number",
    "number.min": "🚫 Cannot be before 1986",
    "number.max": `🚫 Cannot be later than ${new Date().getFullYear()}`
  }),

  dimension: Joi.object({
    length: Joi.number().min(0).optional().messages({
      "number.base": "🚫 Length must be a number",
      "number.min": "🚫 Length must be ≥ 0"
    }),
    width: Joi.number().min(0).optional().messages({
      "number.base": "🚫 Width must be a number",
      "number.min": "🚫 Width must be ≥ 0"
    }),
    height: Joi.number().min(0).optional().messages({
      "number.base": "🚫 Height must be a number",
      "number.min": "🚫 Height must be ≥ 0"
    })
  }).optional(),

  engine: Joi.object({
    power: Joi.string().optional().messages({
      "string.empty": "🚫 Power cannot be empty"
    }),
    fuelconsumsion: Joi.string().optional().messages({
      "string.empty": "🚫 Fuel consumption cannot be empty"
    })
  }).optional(),

  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": "🚫 Stock must be a number",
    "number.min": "🚫 Stock cannot be negative",
    "number.integer": "🚫 Stock must be an integer"
  }),

  viewCount: Joi.number().min(0).precision(1).optional().messages({
    "number.base": "🚫 View count must be a number",
    "number.min": "🚫 View count cannot be negative"
  }),

  rating: Joi.number().min(1).max(5).optional().messages({
    "number.base": "🚫 Rating must be a number",
    "number.min": "🚫 Rating must be at least 1 star",
    "number.max": "🚫 Rating cannot be more than 5 stars"
  }),

  status: Joi.string().valid("active", "inactive").optional().messages({
    "any.only": "🚫 Status must be either active or inactive"
  }),

  createBy: Joi.string().hex().length(24).optional().messages({
    "string.hex": "🚫 createBy must be a valid ObjectId",
    "string.length": "🚫 createBy must be 24 characters long"
  }),
});
