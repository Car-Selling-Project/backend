export const parseFormObjects = (req, res, next) => {
  try {
    const keys = ["car", "engine", "dimension", "detail"];
    for (const key of keys) {
      if (typeof req.body[key] === "string") {
        req.body[key] = JSON.parse(req.body[key]);
      }
    }
    next();
  } catch (err) {
    return res.status(400).json({
      message: "❌ Invalid JSON format in request body",
      error: err.message,
    });
  }
};