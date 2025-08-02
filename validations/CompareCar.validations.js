import Joi from "joi";
export const compareCarSchema = Joi.object({
  carIds: Joi.array()
    .items(
      Joi.string()
        .hex()
        .length(24)
        .messages({
          "string.hex": "🚫 Each carId must be a valid ObjectId (hex)",
          "string.length": "🚫 Each carId must be 24 characters long",
        })
    )
    .min(2)
    .max(3)
    .required()
    .messages({
      "array.base": "🚫 carIds must be an array",
      "array.min": "🚫 At least 2 carIds required",
      "array.max": "🚫 Maximum 3 carIds allowed",
      "any.required": "🚫 carIds are required",
    }),
});
