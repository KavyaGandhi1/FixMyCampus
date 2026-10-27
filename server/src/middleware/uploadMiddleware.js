import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

/**
 * Uploads an image buffer to Cloudinary or falls back to data URI
 * @param {Express.Multer.File} file 
 * @returns {Promise<{ url: string, publicId: string | null }>}
 */
export const processImageUpload = async (file) => {
  if (!file) return { url: null, publicId: null };

  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'fixmycampus/issues',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Fallback: Embed as Base64 data URL (zero external dependency required for local testing)
  const base64Data = file.buffer.toString('base64');
  const dataUri = `data:${file.mimetype};base64,${base64Data}`;
  return {
    url: dataUri,
    publicId: null
  };
};
