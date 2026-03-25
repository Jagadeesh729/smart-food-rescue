const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

const fs = require('fs');
const path = require('path');

dotenv.config();

let storage;
const useCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key';

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'smart_food_rescue',
      allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
    },
  });
} else {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: Cloudinary API keys missing! Using local file storage. Images will be wiped on serverless deployments (e.g. Vercel, Heroku). Configure .env for production.');
  
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  });
}

const upload = multer({ storage: storage });

module.exports = {
  upload,
  cloudinary: useCloudinary ? cloudinary : null
};
