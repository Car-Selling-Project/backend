import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config(); // Load biến môi trường từ .env

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer ảnh từ Multer lên Cloudinary
 * @param {Express.Multer.File} file - file từ Multer
 * @param {string} folder - tên thư mục lưu trên Cloudinary
 * @returns {Promise<string>} URL ảnh sau khi upload
 */
export const uploadToCloudinary = (file, folder = 'vehicles') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result.secure_url); // Trả URL ảnh
      }
    );

    stream.end(file.buffer);
  });
};
export const uploadContractToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'contracts', resource_type: 'raw' }, // raw để upload pdf, doc, ...
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

export default cloudinary;
