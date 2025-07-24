// middlewares/validateRequest.js
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map(err => ({
        key: err.context.key,
        message: err.message
      }));
      return res.status(400).json({ errors: errorDetails });
    }

    next();
  };
};
