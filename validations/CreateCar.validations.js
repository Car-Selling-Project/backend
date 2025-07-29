import Joi from "joi";

export const createCarSchema = Joi.object({
  car: Joi.object({
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
    }),}).required(),
  engine: Joi.object({
    fuelType: Joi.string().required().messages({
      "any.required": "🚫 Fuel type is required",
      "string.empty": "🚫 Fuel type cannot be empty"
    }),
    gasoline: Joi.string().required().messages({
      "any.required": "🚫 Gasoline information is required",
      "string.empty": "🚫 Gasoline cannot be empty"
    }),
    steering: Joi.string().required().messages({
      "any.required": "🚫 Steering type is required",
      "string.empty": "🚫 Steering cannot be empty"
    }),
    power: Joi.string().required().messages({
      "any.required": "🚫 Engine power is required",
      "string.empty": "🚫 Power cannot be empty"
    }),
  }).required(),

  dimension: Joi.object({
    length: Joi.number().min(2800).max(5500).required().messages({
      "any.required": "🚫 Length is required",
      "number.base": "🚫 Length must be a number",
      "number.min": "🚫 Length must be at least 2800 mm",
      "number.max": "🚫 Length must be at most 5500 mm"
    }),
    width: Joi.number().min(1400).max(2200).required().messages({
      "any.required": "🚫 Width is required",
      "number.base": "🚫 Width must be a number",
      "number.min": "🚫 Width must be at least 1400 mm",
      "number.max": "🚫 Width must be at most 2200 mm"
    }),
    height: Joi.number().min(1200).max(2100).required().messages({
      "any.required": "🚫 Height is required",
      "number.base": "🚫 Height must be a number",
      "number.min": "🚫 Height must be at least 1200 mm",
      "number.max": "🚫 Height must be at most 2100 mm"
    }),
    cargoCapacity: Joi.number().min(100).max(2500).required().messages({
      "any.required": "🚫 Cargo capacity is required",
      "number.base": "🚫 Cargo capacity must be a number",
      "number.min": "🚫 Must be at least 100 L",
      "number.max": "🚫 Must be at most 2500 L"
    })
  }).required(),

  detail: Joi.object({
    registrationYear: Joi.number()
      .min(1986)
      .max(new Date().getFullYear())
      .required()
      .messages({
        "any.required": "🚫 Registration year is required",
        "number.base": "🚫 Registration year must be a number",
        "number.min": "🚫 Registration year cannot be earlier than 1986",
        "number.max": `🚫 Registration year cannot be later than ${new Date().getFullYear()}`
      }),
    type: Joi.string().valid("SUV", "Electric SUV", "Sedan", "Coupe").required().messages({
      "any.only": "🚫 Type must be one of: SUV, Electric SUV, Sedan, Coupe",
      "any.required": "🚫 Type is required"
    }),
    seat: Joi.number().integer().min(2).max(20).required().messages({
      "any.required": "🚫 Seat count is required",
      "number.base": "🚫 Seat must be a number",
      "number.min": "🚫 Must have at least 2 seats",
      "number.max": "🚫 Must have at most 20 seats",
      "number.integer": "🚫 Seat must be an integer"
    }),
    exteriorColor: Joi.string().required().messages({
      "any.required": "🚫 Exterior color is required",
      "string.empty": "🚫 Exterior color cannot be empty"
    })
  }).required()
});
