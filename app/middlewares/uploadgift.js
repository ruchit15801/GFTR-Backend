const multer = require('multer')

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/gift");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `/user-${file.originalname}-${Date.now()}.${ext}`);
  },
});

const maxSize = 1 * 1000 * 1000;

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: maxSize },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/)) {
      return cb(new Error('Please upload a valid image file'))
    }
    cb(undefined, true)
  }
})

// .array('files',5);

module.exports = upload
