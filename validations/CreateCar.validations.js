import Joi from "joi";

export const createCarSchema = Joi.object({
  title: Joi.string().required().messages({
    "any.required": "🚫 Car title is required",
    "string.empty": "🚫 Car title cannot be empty"
  }),

  description: Joi.string().required().messages({
    "any.required": "🚫 Description is required",
    "string.empty": "🚫 Description cannot be empty"
  }),

  brandId: Joi.string().hex().length(24).required().messages({
    "any.required": "🚫 brandId is required",
    "string.hex": "🚫 brandId must be a valid ObjectId (hex)",
    "string.length": "🚫 brandId must be 24 characters long"
  }),

  locationId: Joi.string().hex().length(24).required().messages({
    "any.required": "🚫 locationId is required",
    "string.hex": "🚫 locationId must be a valid ObjectId (hex)",
    "string.length": "🚫 locationId must be 24 characters long"
  }),

  model: Joi.string().required().messages({
    "any.required": "🚫 Model is required",
    "string.empty": "🚫 Model cannot be empty"
  }),

  price: Joi.number().min(0).required().messages({
    "any.required": "🚫 Price is required",
    "number.base": "🚫 Price must be a number",
    "number.min": "🚫 Price must be at least 0"
  }),

  fuelType: Joi.string().valid("Gasoline", "Diesel", "Electric", "Hybrid").required().messages({
    "any.only": "🚫 Invalid fuel type",
    "any.required": "🚫 Fuel type is required"
  }),

  tranmission: Joi.string().valid("Manual", "Automatic").required().messages({
    "any.only": "🚫 Transmission must be Manual or Automatic",
    "any.required": "🚫 Transmission is required"
  }),

  seat: Joi.number().integer().min(2).max(20).required().messages({
    "any.required": "🚫 Seat count is required",
    "number.base": "🚫 Seat must be a number",
    "number.min": "🚫 Must have at least 2 seats",
    "number.max": "🚫 Must have at most 20 seats",
    "number.integer": "🚫 Seat must be an integer"
  }),

  carType: Joi.string().valid("Sedan", "SUV", "Hatchback", "Pickup", "MPV").required().messages({
    "any.only": "🚫 Invalid car type",
    "any.required": "🚫 Car type is required"
  }),

  exteriorColor: Joi.array().items(Joi.string().required()).min(1).required().messages({
    "any.required": "🚫 Exterior color is required",
    "array.base": "🚫 Exterior color must be an array of strings",
    "array.min": "🚫 At least one color must be provided"
  }),

  registrationYear: Joi.number().integer().min(1986).max(new Date().getFullYear()).required().messages({
    "any.required": "🚫 Registration year is required",
    "number.base": "🚫 Registration year must be a number",
    "number.min": "🚫 Cannot be before 1986",
    "number.max": `🚫 Cannot be later than ${new Date().getFullYear()}`
  }),

  dimension: Joi.object({
    length: Joi.number().min(0).required().messages({
      "any.required": "🚫 Length is required",
      "number.base": "🚫 Length must be a number",
      "number.min": "🚫 Length must be ≥ 0"
    }),
    width: Joi.number().min(0).required().messages({
      "any.required": "🚫 Width is required",
      "number.base": "🚫 Width must be a number",
      "number.min": "🚫 Width must be ≥ 0"
    }),
    height: Joi.number().min(0).required().messages({
      "any.required": "🚫 Height is required",
      "number.base": "🚫 Height must be a number",
      "number.min": "🚫 Height must be ≥ 0"
    })
  }).required(),

  engine: Joi.object({
    power: Joi.string().required().messages({
      "any.required": "🚫 Engine power is required",
      "string.empty": "🚫 Power cannot be empty"
    }),
    fuelconsumsion: Joi.string().required().messages({
      "any.required": "🚫 Fuel consumption is required",
      "string.empty": "🚫 Fuel consumption cannot be empty"
    })
  }).required(),

  stock: Joi.number().integer().min(0).required().messages({
    "any.required": "🚫 Stock is required",
    "number.base": "🚫 Stock must be a number",
    "number.min": "🚫 Stock cannot be negative",
    "number.integer": "🚫 Stock must be an integer"
  }),

  viewCount: Joi.number().min(0).precision(1).messages({
    "number.base": "🚫 View count must be a number",
    "number.min": "🚫 View count cannot be negative"
  }),

  status: Joi.string().valid("active", "inactive").default("inactive").messages({
    "any.only": "🚫 Status must be either active or inactive"
  }),
  rating: Joi.number()
  .min(1)
  .max(5)
  .required()
  .messages({
    "number.base": "🚫 Rating must be a number",
    "number.min": "🚫 Rating must be at least 1 star",
    "number.max": "🚫 Rating cannot be more than 5 stars",
    "any.required": "🚫 Rating is required",
  }),
 createBy: Joi.string().hex().length(24).optional().messages({
  "string.hex": "🚫 createBy must be a valid ObjectId",
  "string.length": "🚫 createBy must be 24 characters long"
})

});
