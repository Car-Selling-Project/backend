export const validateRequest = (schema) => {
  return (req, res, next) => {
    // Clone lại để không ảnh hưởng req gốc
    const body = { ...req.body };

    // Nếu gửi multipart/form-data mà có images, ta xóa thủ công
    delete body.images;

    const { error } = schema.validate(body, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map(err => ({
        key: err.path.join("."),
        message: err.message
      }));
      return res.status(400).json({ errors: errorDetails });
    }

    next();
  };
};
