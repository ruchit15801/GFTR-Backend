const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller')
const { authAdmin } = require("../middlewares/verifyToken")
// const cors = require('cors')

//======================== Authentication =======================
router.post('/admin/login', adminController.signin)
router.post('/admin/forgotPassword', adminController.forgotPassword)
router.post('/admin/setNewPassword', authAdmin, adminController.setNewPassword)


//======================== Manage Profile =======================
router.get('/admin/profile', authAdmin, adminController.adminProfile)
router.post('/admin/verifyOldPassword', authAdmin, adminController.verifyOldPassword)
// router.post('/admin/updateProfile', authAdmin, adminController.updateProfile)


// ===================== Manage Users ===============================
router.get('/admin/viewUsers', /*authAdmin,*/ adminController.viewUsers) // referralCode + node
router.post('/admin/search', authAdmin, adminController.searchUser) // search by wallet or user id
router.post('/admin/blockUser', authAdmin, adminController.blockUser) // block & unblock
router.post('/admin/updateMail', authAdmin, adminController.updateUserEmail) // update user email
// router.get("/admin/users", adminController.allUsers) // for checking

// ======================== manages blog ============================
router.post('/admin/addblog', /*authAdmin,*/ adminController.addblog)//add blog
router.post('/admin/blogimgupload', /*authAdmin,*/ adminController.blogImgUpload)// add img
router.put('/admin/editblog/:id', /*authAdmin,*/ adminController.editblog) // edit
router.delete('/admin/deleteblog/:id', /*authAdmin,*/ adminController.deleteblog) // delete


module.exports = router
