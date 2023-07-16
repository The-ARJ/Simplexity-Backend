const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let uploadPath;
      if (file.fieldname === 'userImage') {
        uploadPath = './uploads/user_images';
      } else if (file.fieldname === 'productImage') {
        uploadPath = './uploads/product_images';
      } else if (file.fieldname === 'contactImage') {
        uploadPath = './uploads/contact-images';
      } else {
        throw new Error('Invalid fieldname');
      }
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      let ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}--${Date.now()}${ext}`);
    } catch (err) {
      cb(err);
    }
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

// configure multer
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


module.exports = upload
