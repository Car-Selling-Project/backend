import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const handleImageUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "🚫 No images uploaded" });
  }

  try {
    const urls = await Promise.all(
      req.files.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "cars" },
            (err, result) => {
              if (err) return reject(err);
              resolve(result.secure_url);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
      })
    );

    req.body.images = urls;
    next();
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err);
    return res.status(500).json({
      message: "🚫 Failed to upload images to Cloudinary",
      error: err.message,
    });
  }
};
