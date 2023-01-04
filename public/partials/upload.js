const multer = require('multer')
const maxSize = 1 * 1000 * 1000;

//for image
const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpg" || file.mimetype.split("/")[1] === "jpeg" || file.mimetype.split("/")[1] === "png") {
        cb(null, true);
    } else {
        req.fileValidationError = 'Please select valid image format!';
        return cb(null, false, new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
}

const storeAvatar = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split("/")[1];
        const originalname = file.originalname.split(".")[0];
        cb(null, `devTeamMember-${originalname}-${Date.now()}.${ext}`);
    }
})

const uploadAvatar = multer({
    fileFilter: multerFilter,
    limits: { fileSize: maxSize },
    storage: storeAvatar,
}).single('avatar')


//for application
const appMulterFilter = (req, file, cb) => {
    if (file.originalname.split(".").pop() === "apk") {
        cb(null, true);
    } else {
        req.fileValidationError = 'Please select valid app format!';
        return cb(null, false, new Error("Only .apk format allowed!"));
    }
}

const storeApplication = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/appFile')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split(".").pop()
        const originalname = file.originalname.split(".")[0];
        cb(null, `metalinkApp-${originalname}-${Date.now()}.${ext}`);
    }
})

const uploadApp = multer({
    fileFilter: appMulterFilter,
    limits: { fileSize: 500 * 1000 * 1000 },
    storage: storeApplication,
}).single('app')


module.exports = {
    uploadAvatar,
    uploadApp
}