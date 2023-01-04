const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user.controller')
const blogControllers = require('../controllers/stories.controller')
const giftControllers = require('../controllers/gift.controller')
const { verifyToken, verifyResetPasswordToken } = require('../middlewares/verifyToken')
const { authUser } = require("../middlewares/verifyToken")
const upload = require("../middlewares/uploadgift")
const upload2 = require("../middlewares/uploadBlog")


//=================== Authentication ================================

//verify signup details
router.post('/signup', userControllers.signup)
//verify email
router.post('/verifyOtp', userControllers.verifyOtp)
//signin user
router.post('/signin', userControllers.signin)
router.post('/resendOtp', userControllers.resendOtp)
router.post('/forgotPassword', userControllers.forgotPassword)
router.post('/verifyForgotOtp', userControllers.verifyForgotOtp)
router.put('/setNewPassword', userControllers.setNewPassword)
router.post('/logout', authUser, userControllers.logout)
router.post('/setting', userControllers.setting)
router.get('/blogpost', userControllers.blogpost)
router.post('/contactgift', userControllers.contactgift)

//=================== Manage user profile ================================

router.get('/getUserProfile', authUser, userControllers.getUserProfile)
router.put('/updateProfile', authUser, userControllers.updateProfile)
router.post('/verifyMail', authUser, userControllers.verifyMail)

// ==================== Stories========================
router.post('/addblog', upload2.fields([{ name: 'image', maxCount: 1 }]), blogControllers.addBlog)
router.post('/editblog/:id', upload2.fields([{ name: 'image', maxCount: 1 }]), blogControllers.editBlog)
router.delete('/deleteblog/:id', blogControllers.deleteBlog)
router.post('/viewblog', blogControllers.viewBlogs)

// ==================== Gift ========================
router.post('/addgift', giftControllers.addFolder)
router.post('/editgift/:id', giftControllers.editGift)
router.delete('/deletegift/:id', giftControllers.deleteGift)
router.get('/viewgift', giftControllers.viewGift)
router.get('/viewfolder', giftControllers.viewfolder)

// ==================== Form =========================
router.post('/addtoform/:id', upload.fields([{ name: 'image', maxCount: 1 }]), giftControllers.addTo)



module.exports = router