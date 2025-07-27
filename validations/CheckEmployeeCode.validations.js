import Joi from "joi";


const checkEmployeeCodeSchema = Joi.object({
  employeeCode: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (value.includes(" ")) {
        return helpers.message("Employee code must not contain spaces");
      }
      if (value.includes("\n")) {
        return helpers.message("Employee code must not contain new lines");
      }
      if (!/^AD\d{4}$/.test(value)) {
        return helpers.message("Employee code must start with 'AD' followed by 4 digits (e.g., AD1234)");
      }
      return value;
    })
    .messages({
      "string.empty": `"employeeCode" is required`,
    }),
});

export default checkEmployeeCodeSchema;
