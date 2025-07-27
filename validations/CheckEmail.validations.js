import Joi from "joi";
const checkEmailExistsSchema =Joi.object({
     email: Joi.string()
        .required()
        .custom((value, helpers) => {
          // Kiểm tra từng trường hợp cụ thể theo đúng thứ tự
          if (typeof value !== "string") {
            return helpers.message(`"email" must be a string`);
          }
          if (value.includes('\n')) {
            return helpers.message("Email must not contain new lines");
          }
          if (value.includes(' ')) {
            return helpers.message("Email must not contain spaces");
          }
          if ((value.match(/@/g) || []).length > 1) {
            return helpers.message("Email must not contain multiple @ characters");
          }
          return value;
        })
        .messages({
          "string.empty": `"email" is required`,
          "string.base": `"email" must be a string`,
        }),
    
});
export default checkEmailExistsSchema;