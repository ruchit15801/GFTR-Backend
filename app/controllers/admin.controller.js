var ObjectId = require('mongoose').Types.ObjectId;
const HTTP = require("../../constants/responseCode.constant");
const Admin = require("../models/admin.model");
const { users } = require('../models/user.model')
const jwt = require('jsonwebtoken');
const { hashSync, compareSync, genSaltSync } = require('bcrypt');
const { formateNodeData, formateUserData, encryptUserModel, encryptNodeModel, sendEmailOTP } = require('../../public/partials/utils');
const excel = require('exceljs');
const { enc } = require('crypto-js');
const blog = require('../models/stories.model');
const UserSession = require('../models/userSession.model');
const { WorkerChannelPage } = require('twilio/lib/rest/taskrouter/v1/workspace/worker/workerChannel');

//Add default admin
(async function deafultAdminsignup(req, res) {
    try {
        const adminData = { username: "admin", email: "admin@gmail.com", role: "admin" }
        const password = "Gftradmin@@4080"
        const encData = await encryptUserModel(adminData)
        const existsAdmin = await users.findOne({ email: encData.email, role: encData.role })

        //Admin exist 
        if (existsAdmin) return

        const userData = await new users({ ...adminData, password: hashSync(password.trim(), 8), isVerified: true }).save()
        if (!userData) console.log("Unable to add default admin")

        return
    } catch (e) {
        console.log(e);
        return
    }
})();

//signin
async function signin(req, res) {
    try {
        let { password, email } = req.body
        if (!req.body || !password || !email) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_ALLOWED, "message": "Email or password is invalid", data: {} })
        }
        const encData = await encryptUserModel({ email, password })
        // console.log(encData.email)
        const adminExists = await users.findOne({ email: encData.email })

        if (!adminExists) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_ALLOWED, "message": "Email is incorrect", data: {} })
        }

        if (adminExists.role !== "admin") return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Invalid credentials.', data: {} })

        if (!compareSync(password, adminExists.password)) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.BAD_REQUEST, "message": "Password is incorrect", data: {} })
        }


        const token = jwt.sign({ id: adminExists._id }, process.env.JWT_SECRET, { expiresIn: "24h" })


        return res.status(HTTP.SUCCESS).send({
            'status': true,
            'message': "Logged in successfully!",
            'data': "Bearer " + token
        })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//forgot password
async function forgotPassword(req, res) {
    try {
        let { email } = req.body

        if (!email) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_ALLOWED, "message": "provide email", data: {} })
        }

        result = await Admin.findOne({ email })
        if (!result) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_FOUND, "message": "Record not found", data: {} })
        }

        const token = jwt.sign({ id: result._id, }, process.env.JWT_SECRET, { expiresIn: "15m" });
        return res.status(HTTP.SUCCESS).send({
            "status": true, 'code': HTTP.SUCCESS, "message": "Admin detail is valid!", data: "Bearer " + token
        })

    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//set new password
async function setNewPassword(req, res) {
    try {
        let { password, cpassword } = req.body
        if (req.body && password && cpassword) {

            //check password   
            if (password != cpassword) {
                return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password and confirm password does not match', data: {} })
            }
            // add other validations
            if (password.length < 8 || password.length > 16) {
                return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password must be between of 8 to 16 characters!', data: {} })
            }

            password = hashSync(password.trim(), 10)

            const result = await Admin.findByIdAndUpdate(req.user._id, { password }, { new: true });
            if (!result) {
                return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Unable to update password', data: {} })
            }

            return res.status(HTTP.SUCCESS).send({ "success": true, 'code': HTTP.SUCCESS, "message": "New Password has been set", data: {} })
        } else {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_ALLOWED, "message": "New password and confirm password is required", data: {} })
        }
    } catch (err) {
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//profile
async function adminProfile(req, res) {
    try {

        if (!req.user.user) {
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.UNAUTHORIZED, 'message': 'Please authenticate yourself.', data: {} })
        }

        const admin = await users.findById(req.user.user._id)

        if (!admin) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Admin not found!", data: {} })
        }
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "Admin profile.", data: admin })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//Verify old password 
async function verifyOldPassword(req, res) {
    try {
        let { password = password.trim() } = req.body
        if (password.length === 0) {
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password is required!', data: {} })
        }
        let adminData = await Admin.findById(req.user._id)
        if (!adminData) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_FOUND, "message": "Admin not exists!", data: {} })
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password must be between of 8 to 16 characters!', data: {} })
        }

        const isValidPassword = compareSync(password, adminData.password)
        if (!isValidPassword) {
            return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Please enter correct password!', data: {} })
        }

        return res.status(HTTP.SUCCESS).send({ 'success': true, 'code': HTTP.SUCCESS, 'message': 'Password is valid', data: {} })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


// view all users
async function viewUsers(req, res) {
    try {

        let formattedUserData = []
        const usersData = await users.find({ role: "user" })
        if (!usersData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "No Users available!", data: {} })


        for (const data of usersData) {

            const latestSession = await UserSession.find({ userid: data._id, isActive: true }).sort({ _id: -1 }).limit(1)
            let logged = ""
            for (const sessionData of latestSession) {
                logged = sessionData.createdAt
            }

            // if (data.rewards) reward = data.rewards


            formattedUserData.push({ username: data.username, email: data.email, status: data.status, createdAt: data.createdAt, lastLogged: logged })
            // total = 0
            logged = ""
            // reward = 0
        }

        // for (const data of usersData) { formattedUserData.push(await formateUserData(data)) }
        if (formateUserData.length === 0) {
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'No Users found.', data: {} })
        }
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Users details.", data: formattedUserData })


    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


// search user by user id / wallet id
async function searchUser(req, res) {
    try {
        const { userid } = req.body
        if (!userid) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Search by userid or wallet address!", data: {} })

        if (userid) {
            const userData = await users.findById(userid)
            if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "could not find user with this user id!", data: {} })
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "User data by id!", data: { userData } })
        }
        // const walletData = await users.find({ walletAddress }) 
        // if(!walletData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "could not find user with this wallet address!", data: {} }) 

        // return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "User data by wallet", data: {walletData} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

async function blockUser(req, res) {
    try {
        const { email } = req.body
        const encData = await encryptUserModel({ email })

        const userData = await users.findOne({ email: encData.email })
        console.log("🚀 ~ file: admin.controller.js ~ line 577 ~ blockUser ~ encData.email", encData.email)
        console.log("🚀 ~ file: admin.controller.js ~ line 577 ~ blockUser ~ email", email)
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Could not find user.", data: {} })

        if (userData.status === true) {
            userData.status = false
            await userData.save()
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "User Blocked.", data: userData })
        }

        if (userData.status === false) {
            userData.status = true
            await userData.save()
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.SUCCESS, "message": "User Unblocked.", data: userData })
        }

        if (userData.status == "Unblocked") {
            userData.status = "Blocked"
            await userData.save()
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User Blocked', data: { userData } })
        }

        if (userData.status == "Blocked") {
            userData.status = "Unblocked"
            await userData.save()
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User Unblocked', data: { userData } })
        }


        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "", data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


// update user email
async function updateUserEmail(req, res) {
    try {

        const { email, newEmail } = req.body

        // encrypt and check if email exist
        const encData = await encryptUserModel({ email })
        const userData = await users.findOne({ email: encData.email })
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Could not find user.", data: {} })

        // update email
        const updateData = await encryptUserModel({ email: newEmail })
        const update = await users.findOneandUpdate({ email: encData }, { email: updateData.email }, { new: true })
        if (!update) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Could not update user.", data: {} })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "User email updated.", data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// update user 
async function updateUser(req, res) {
    try {

        const { username, /*email*/ password } = req.body

        if (!username || !password) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "All fields are required!", data: {} })

        // if (!email.includes('@')) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })

        if (password.length < 8 || password.length > 16) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Invalid password!", data: {} })
        } else {
            const salt = genSaltSync(10);
            password = hashSync(password, salt);
        }

        const encData = await encryptUserModel({ username })
        const userData = await users.findOne({ username: encData.username })
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Could not find user.", data: {} })
        userData.email = encData.email
        userData.password = password

        await userData.save()
        if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update user!', data: {} })
        userData.decryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User Updated', data: { userData } })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// add blog
async function addblog(req, res) {
    try {
        const { title, content } = req.body
        const saveData = await blog({ title, content }).save()
        res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Users details.", data: { saveData } })
    } catch (err) {                                                                                                                                                                                                                                          
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// Add img of blog
async function blogImgUpload(req, res) {

    console.log("🚀 ---------------- blogImgUpload --------------------> ", req.params.id)
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("🚀 ~ file: admin.controller.js:98 ~ err", err)
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": 'A Multer error occurred when uploading.', data: {} })
        } else if (err) {
            console.log("🚀 ~ file: admin.controller.js:100 ~ err", err)
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": 'An unknown error occurred when uploading.', data: {} })
        }


        Blog.findByIdAndUpdate({ _id: req.params.id }, { image: req.file.filename }, { new: true }).then(() => {
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "Blog Images added successfully!", data: {} })
        }).catch(e => {
            console.log(e);
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
        })

    })
}
// edit blog
async function editblog(req, res) {
    try {
        const editblog = await blog.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            content: req.body.content
        }, { new: true })
        if (!editblog) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Blog not found with id " + req.params.id, data: {} })

        }
        // console.log(editblog);
        res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.SUCCESS, "message": "Blog updated! ", data: { editblog } })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// delete blog
async function deleteblog(req, res) {
    try {
        const deleteblog = await blog.findByIdAndRemove(req.params.id, { new: true })
        if (!deleteblog) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Blog not found with id " + req.params.id, data: {} })

        }
        // console.log(editblog);
        res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.SUCCESS, "message": "Blog Deleted!", data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}



module.exports = {
    signin,
    forgotPassword,
    setNewPassword,

    adminProfile,
    verifyOldPassword,

    viewUsers,
    searchUser,
    blockUser,

    updateUserEmail,
    updateUser,
    addblog,
    editblog,
    deleteblog,
    blogImgUpload


}