const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folderName;
    if (file.fieldname === 'userImage') {
      folderName = 'user_images';
    } else if (file.fieldname === 'productImage') {
      folderName = 'product_images';
    } else if (file.fieldname === 'contactImage') {
      folderName = 'contact_images';
    } else {
      return new Error('Invalid fieldname');
    }

    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);

    return {
      folder: folderName,
      format: 'jpg',
      public_id: `${file.fieldname}--${Date.now()}`,
    };
  },
});


const imageFileFilter = (req, file, cb) => {
  try {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      throw new Error('Invalid file format. Only jpg, jpeg, png and gif are allowed.');
    }
    cb(null, true);
  } catch (err) {
    cb(err, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
