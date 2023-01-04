const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
const HTTP = require("../../constants/responseCode.constant");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const { users } = require('../models/user.model')
const blog = require("../models/stories.model")
const UserSession = require("../models/userSession.model")
const settings = require('../models/setting.model')
const contactgifts = require('../models/contactgift.model')
const { encodeData, decodeData } = require('../../public/partials/cryptoJS')
const { formateUserData, encryptUserModel, encryptNodeModel, setChild, createSessionAndJwtToken, /*sendWelcomeEmail, sendOTPEmail,*/ sendEmail, sendEmailOTP } = require('../../public/partials/utils');
var randomstring = require("randomstring");
const jwt = require('jsonwebtoken');
const cron = require('node-cron')
const Gift = require("../models/gift.model")



async function setcookie(req, res) {
    try {

        // const token = await createSessionAndJwtToken()
        res.cookie("jwttoken", "qwerty", { maxAge: 86_400_000, httpOnly: true });
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "User Registered! check email to verify.", data: {} })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


//signup and register data
async function signup(req, res) {
    try {
        let { email, username, firstname, lastname, password, phoneNumber } = req.body
        if (!username || !email || !password || !firstname || !lastname || !phoneNumber) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "All fields are required!", data: {} })
        }

        if (!email.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Invalid password!", data: {} })
        } else {
            const salt = genSaltSync(10);
            password = hashSync(password, salt);
        }

        const encData = await encryptUserModel({ email, username, /*firstname, lastname,*/ })

        // check user + verified
        // const userValid = await users.findOne({ $and: [{ email: encData.email }, { isVerified: false }] })
        // if (userValid) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "User not verified. Please complete OTP Verification. ", data: {}, page: "verifyOtp" })

        const userExists = await users.findOne({ $or: [{ email: encData.email }, { username: encData.username }] })
        if (userExists) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "User Exists. Please Sign In.", data: {}, page: "signin" })

        const otpCheck = randomstring.generate({ length: 4, charset: 'numeric' })

        const userData = await new users({
            email,
            firstname,
            lastname,
            phoneNumber,
            username,
            password,
            otpCheck
        }).save()

        if (!userData) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to register user!", data: {} })
        }

        //  send otp to email
        // var subject = "Verify your email to join GFTR"
        // // var html = "<h1 style='font-weight:bold;'> Dear "+ username +" <br> We would like to welcome you to the GFTR Community, to get access to all of the assets we prepared to Join the GFTR Ecosystem. <br>First, you must complete your registration using the VERIFICATION CODE below: <br>" + otpCheck + "<br>DO NOT share your password with anyone. Keep the password for your GFTR account and the email address used for unique registration secure to ensure your account is protected.<br>Please try and avoid using a common password used for your other accounts. To ensure your account is protected, always keep your Password with letters and numbers combined with special characters.<br>Thank You,<br>Team GFTR </h1>"
        // var sendOTP = await sendOTPEmail(email, subject, html)
        // if(!sendOTP)


        // ================== send email template ===================

        var sendMailData = {
            "file_template": './public/EmailTemplates/verifyOtp.html',
            "subject": 'Verify Email',
            "to": email ? email : null,
            // "message": `Dear ${ username },` + 'some words'
            "username": `${username}`,
            "otp": `${otpCheck}`

        }

        sendEmailOTP(sendMailData).then((val) => {
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': val })
        }).catch((err) => {
            console.log(err);
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
        })

        userData.decryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY });

        // const token = await createSessionAndJwtToken(userData)
        // res.cookie("jwttoken", token, { maxAge: 86_400_000, httpOnly: true});

        // res.cookie("jwttoken", token, { maxAge: 900_000, sameSite: 'none', secure: true });

        // set child user to parent
        // if (parentExists) {
        //     console.log("🚀 ~ file: user.controller.js ~ line 104 ~ signup ~ parentExists.child", parentExists.child)
        //     parentExists.child = [...parentExists.child, userData._id]
        //     console.log("🚀 ~ file: user.controller.js ~ line 106 ~ signup ~ userData._id", userData._id)
        //     console.log("🚀 ~ file: user.controller.js ~ line 105 ~ signup ~ parentExists.child", parentExists.child)

        //     await parentExists.save()
        // }
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "User Registered! Check your email to verify.", data: await formateUserData(userData) })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// verify otp
async function verifyOtp(req, res) {
    try {
        const eventEmitter = req.app.get('eventEmitter')
        const { email, otp } = req.body
        let result;
        if (!otp) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "provide otp to verify!", data: {} })
        const encData = await encryptUserModel({ email })
        const userData = await users.findOne({ email: encData.email }) // , isVerified: false
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is Invalid!", data: {} })

        if (userData.isVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "User already verified!!", data: {} })


        if (otp == userData.otpCheck) {
            const update = await users.findOneAndUpdate({ email: encData.email }, { isVerified: true, otpCheck: 0 }, { new: true })
            if (!update) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Could not update verification", data: {} })


            //genrate JWT token and store session data
            const authToken = await createSessionAndJwtToken(update)

            // set the child fields of all parents (upto 5 layers)
            // await setChild(update, eventEmitter)

            // send welcome email
            // var subject1 = "Welcome to GFTR"
            // var html1 = "<h2>Hello " + userData.username + ", <br>Congratulations! You have successfully signed up for GFTR Ecosystem </br> We are super excited to welcome you to our GFTR Ecosystem Community.</br> Now you are all set to buy our GFTR NFT Smart Node to start earning passive income.</br> Thank You,</br> Team GFTR"
            // var mail = await sendWelcomeEmail(email, subject1, html1)
            // if(!mail)

            // welcome email template ==============================

            var sendMailData = {
                "file_template": './public/EmailTemplates/welcome.html',
                "subject": 'Welcome to GFTR',
                "to": email ? email : null,
                "username": `${userData.username}`,
            }

            sendEmail(sendMailData).then((val) => {
                return res.status(HTTP.SUCCESS).send({
                    'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': {
                        val,
                        userData: {
                            id: update._id,
                            username: update.username,
                            email: update.email,
                        },
                        token: "Bearer " + authToken
                    }
                })
            }).catch((err) => {
                console.log(err);
                return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
            })

            return res.status(HTTP.SUCCESS).send({
                "status": true, 'code': HTTP.SUCCESS, "message": "Email Verified!", 'data': {
                    userData: {
                        id: update._id,
                        username: update.username,
                        email: update.email,
                        referralCode: update.referralCode
                    },
                    token: "Bearer " + authToken
                }
            })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Invalid Otp!", data: {} })
        }

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// resend otp
async function resendOtp(req, res) {
    try {

        const { email } = req.body

        const encData = await encryptUserModel({ email })

        // check if already verified
        const checkVerified = await users.findOne({ email: encData.email })

        if (!checkVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to find User!", data: {} })

        if (checkVerified.isVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "User is already verified!", data: {} })

        // generate otp
        const newOtp = randomstring.generate({ length: 4, charset: 'numeric' })

        // update that otp in user model aswell
        const updateData = await users.findOneAndUpdate({ _id: checkVerified._id }, { otpCheck: newOtp })
        if (!updateData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Could not update otp in  database!", data: {} })


        // send the new otp in mail

        // var subject = "Verify your email to join GFTR coin"
        // var html = "<h1 style='font-weight:bold;'> Dear "+ updateData.username +" <br> We would like to welcome you to the GFTR Community, to get access to all of the assets we prepared to Join the GFTR Ecosystem. <br><p style='margin-top:5px !important;'>First, you must complete your registration using the VERIFICATION CODE below: <br>" + newOtp + "</p><br>DO NOT share your password with anyone. Keep the password for your GFTR account and the email address used for unique registration secure to ensure your account is protected.<br>Please try and avoid using a common password used for your other accounts. To ensure your account is protected, always keep your Password with letters and numbers combined with special characters.<br>Thank You,<br>Team GFTR </h1>"
        // var sendOTP = await sendOTPEmail(email, subject, html)
        // if(!sendOTP)


        // resend otp email template ===========================

        var sendMailData = {
            "file_template": './public/EmailTemplates/resendOtp.html',
            "subject": 'Resent OTP - GFTR',
            "to": email ? email : null,
            "username": `${checkVerified.username}`,
            "otp": `${newOtp}`
        }

        sendEmailOTP(sendMailData).then((val) => {
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': val })
        }).catch((err) => {
            console.log(err);
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
        })

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Otp Resent, check mail!", data: {} })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//verify signin
async function verifySignin(req, res) {
    try {
        let { password, email } = req.body
        let result;

        if (!req.body || !password || !email) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required!", data: {} })
        }

        //condition to check which data user has been given
        if (email.includes('@')) {
            const encData = await encryptUserModel({ email })
            result = await users.findOne({ email: encData.email })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "invalid email! ", data: {} })
        }

        if (!result) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "User not exists", data: {} })
        }

        if (!result.isVerified) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Account is not verified", data: {} })
        }

        if (!compareSync(password, result.password)) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Password is wrong", data: {} })
        }

        result = await formateUserData(result)

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Signin is valid", data: { email: result.email, username: result.username, firstname: result.firstname, lastname: result.lastname } })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//signin
async function signin(req, res) {
    try {
        let { password, emailorUsername } = req.body

        if (!req.body || !password || !emailorUsername) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Provide email and password", data: {} })

        // condition to check which data user has been given
        if (emailorUsername.includes('@')) {
            const encData = await encryptUserModel({ email: emailorUsername })
            result = await users.findOne({ email: encData.email })
        } else {
            const encData = await encryptUserModel({ username: emailorUsername })
            result = await users.findOne({ username: encData.username })
        }
        console.log("🚀 ~ file: user.controller.js ~ line 324 ~ signin ~ result", result)

        // if (!email.includes('@')) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "incorrect email required", data: {} })  

        // let result;
        // const encData = await encryptUserModel({ email })
        // result = await users.findOne({ email: encData.email })


        if (!result) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "User does not exist", data: {} })

        if (!result.isVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Account is not verified", data: {} })

        // check if user is blocked
        console.log("🚀 ~ file: user.controller.js ~ line 339 ~ signin ~ result.status", result.status)
        if (result.status == "Blocked") return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Your account has been Blocked by Admin!", data: {} })

        if (!compareSync(password, result.password)) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Password is wrong", data: {} })



        //genrate JWT token and store session data
        const token = await createSessionAndJwtToken(result)

        return res.status(HTTP.SUCCESS).send({
            "status": true, 'code': HTTP.SUCCESS, "message": "You have signed-in successfully.", "data": {
                userData: {
                    id: result._id,
                    username: result.username,
                    email: result.email,
                },
                token: "Bearer " + token
            }
        })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


//forgot password
async function forgotPassword(req, res) {
    try {
        let { email } = req.body
        if (req.body && email) {

            if (!email.includes('@')) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Invalid email", data: {} })

            let result
            const encData = await encryptUserModel({ email })
            result = await users.findOne({ email: encData.email })

            if (!result) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Record not found", data: {} })

            if (!result.isVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "User Email verification pending.", data: {}, page: "verifyOtp" })

            await result.decryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY });


            const otpCheck = randomstring.generate({ length: 4, charset: 'numeric' })
            const update = await users.findOneAndUpdate({ email: encData.email }, { otpCheck }, { new: true })


            // send the new otp in mail
            // var subject = "GFTR Coin Account Confirmation Code"
            // var html = "<h1 style='font-weight:bold;'> Hello "+ update.username +" <br> Please enter the following code to confirm your GFTR Coin account: <br> " + otpCheck + "<br><br>Note: If you did not register on GFTR Coin, please disregard this email. </h1>"
            // var sendOTP = await sendOTPEmail(email, subject, html)
            // if(!sendOTP)

            // resent otp email template ====================

            var sendMailData = {
                "file_template": './public/EmailTemplates/resendOtp.html',
                "subject": 'Resent OTP - GFTR',
                "to": email ? email : null,
                "username": `${result.username}`,
                "otp": `${otpCheck}`
            }

            sendEmailOTP(sendMailData).then((val) => {
                return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': val })
            }).catch((err) => {
                console.log(err);
                return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
            })

            return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "User details are valid!", data: result })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Provide email", data: {} })
        }
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}
// verify otp for forgotPassword + change password
async function verifyForgotOtp(req, res) {
    try {

        const { email, otp } = req.body

        if (!email || !otp) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required", data: {} })

        if (!otp) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Provide otp to verify!", data: {} })

        const encData = await encryptUserModel({ email })
        const userData = await users.findOne({ email: encData.email })
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is Invalid!", data: {} })

        if (otp == userData.otpCheck) {

            const update = await users.findOneAndUpdate({ email: encData.email }, { otpCheck: 0 }, { new: true })
            if (!update) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Could not update password.", data: {} })

            return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Otp Verified!", data: update })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Invalid Otp!", data: {} })
        }

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//Set new password
async function setNewPassword(req, res) {
    try {
        let { email, password, cpassword } = req.body
        if (!req.body || !email || !password || !cpassword) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required!", data: {} })

        //check password   
        if (password != cpassword) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password and confirm password does not match', data: {} })

        if (password.trim().length < 8 || password.trim().length > 16) {
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password must be between of 8 to 16 characters!', data: {} })
        }


        const enc = await encryptUserModel({ email })

        const userData = await users.find({ email: enc.email });
        if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'User does not exists!', data: {} })

        for (const data of userData) {

            const isNewPassword = compareSync(password, data.password)
            if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

        }
        const salt = genSaltSync(10);
        password = hashSync(password, salt);


        const result = await users.findOneAndUpdate({ email: enc.email }, { password }, { new: true })
        if (!result) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Unable to set new password!', data: {} })
        console.log("🚀 ~ file: user.controller.js ~ line 521 ~ setNewPassword ~ result ", result.password)


        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "New Password has been set", data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//Logout user session
async function logout(req, res) {
    try {
        if (!req.user.sessionId) return res.status(HTTP.BAD_REQUEST).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Please authenticate", data: {} })

        const userData = await UserSession.findOneAndUpdate({ _id: req.user.sessionId, userid: req.user.id, isActive: true }, { isActive: false }, { new: true })
        if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User session is invalid', data: {} })

        // res.clearCookie("jwttoken");
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User logged out successfully', data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


//get user profile
async function getUserProfile(req, res) {
    try {
        const { id } =
            console.log("req.user.id---------------", req.user.id);
        let result = await users.findById(req.user.id)
        if (!result) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "Record not found", data: {} })

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "User Profile", data: await formateUserData(result) })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//update user profile
async function updateProfile(req, res) {
    try {
        let { username, email, password } = req.body

        if (Object.keys(req.body).length === 0) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'No changes are available for update', data: {} })

        const isValidUpdate = Object.keys(req.body).every((key) => {
            if (["username", "password", "email"].includes(key)) return true
            return false
        })

        if (!isValidUpdate) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Update is not allowed!', data: {} })

        console.log("🚀 ~ file: user.controller.js ~ line 549 ~ updateProfile ~ req.user._id ~~~~~~~~~~~~~~~~~~~~~~~", req.user._id)
        let userData = await users.findById(req.user._id)
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "User does not exists!", data: {} })

        const encData = await encryptUserModel({ username, email, password })
        if (username && username != userData.username) {
            const checkUsername = await users.findOne({ username: encData.username })
            if (checkUsername) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "username already exists", data: {} })
            userData.username = username
        }

        if (password) {
            if (password.trim().length < 8 || password.trim().length > 16) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password length must be between 8 to 16', data: {} })

            const isNewPassword = compareSync(password, userData.password)
            if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

            const salt = genSaltSync(10);
            userData.password = hashSync(password, salt);
        }

        // if(email && email != userData.email){
        //     const checkemail = await users.findOne({ email: encData.username })
        //     if(checkemail) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "username already exists", data: {} })
        //     // send otp to mail
        //     const otpCheck = randomstring.generate({ length: 4, charset: 'numeric' })
        //     userData.otpCheck = otpCheck

        //     var sendMailData = {
        //         "file_template": './public/EmailTemplates/verifyOtp.html',
        //         "subject": 'Verify OTP for email change',
        //         "to": checkemail.email ? checkemail.email : null,
        //         // "message": `Dear ${ userData.username },`,
        //         "username": `${ userData.username }`,
        //         "otp": `${ otpCheck }`
        //     }

        //     sendEmailOTP(sendMailData).then((val) => {
        //         return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': val })
        //     }).catch((err) => {
        //         console.log(err);
        //         return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
        //     })
        // }

        await userData.save()
        if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update profile!', data: {} })

        userData.decryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY });
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'profile updated', data: { userData } })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// verifyMail
async function verifyMail(req, res) {
    try {
        const { otp, email, newEmail } = req.body
        if (!email.includes('@') || !newEmail.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }
        const encData = await encryptUserModel({ email })
        const userData = await users.findOne({ email: encData.email })
        if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User not found!', data: {} })

        if (otp == userData.otpCheck) {
            const updateEmail = await users.findOneAndUpdate({ email: encData.email }, { email: newEmail, otpCheck: 0 }, { new: true })
            if (!updateEmail) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Could not update email!', data: {} })

        }

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'profile updated', data: await formateUserData(updateEmail) })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// Setting 
async function setting(req, res) {
    try {
        const { whoCanSee, birthdayReminder, holidayReminder,
            emailOrText, birthday, phoneNumber, email, address, myanniversary, valentineday, easter, mothersday, fathersday, hanukkah, christmas } = req.body
        if (!email.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }
        if (!req.body) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required!", data: {} })

        const settingData = settings({
            whoCanSee, birthdayReminder, holidayReminder,
            emailOrText, birthday, phoneNumber, email, address, myanniversary, valentineday, easter, mothersday, fathersday, hanukkah, christmas
        }).save()
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, 'message': 'profile updated', data: { settingData } })
    } catch (err) {
        console.log(err)
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

// Blog post on home page
async function blogpost(req, res) {
    try {
        const post = await blog.find({})
        if (!post) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Blog not found", data: {} })

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, data: { post } })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//Contact gift               
async function contactgift(req, res) {
    try {
        const { name, email, phone, text } = req.body
        // console.log(req.body);
        if (!email.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }
        if (!req.body) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required!", data: {} })

        const contactgift = contactgifts({
            name, email, phone, text
        }).save()

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Thanks for contacting us!", data: {} })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}



/***********************************************/
//-------------- for development only ----------/
/***********************************************/


//Decode data(only for developement)
function encodeReqData(req, res) {
    try {
        if (req.body.decData) {
            return res.status(200).send({ 'status': true, 'message': 'encoded data', data: encodeData(req.body.decData) })
        } else {
            return res.status(401).send({ "status": false, "message": "Please provide data", data: {} })
        }

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//Decode data(only for developement)
function decodeResData(req, res) {
    try {
        if (req.body.encData) {
            // return res.status(200).send({ 'status': true, 'message': 'Decoded data', data: decodeData(req.body.encData) })
            return res.send(decodeData(req.body.encData))
        } else {
            return res.status(401).send({ "status": false, "message": "Please provide data", data: {} })
        }
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


module.exports = {
    setcookie,
    signup,
    verifyOtp,
    resendOtp,
    verifySignin,
    signin,
    forgotPassword,
    verifyForgotOtp,
    setNewPassword,
    logout,

    getUserProfile,
    updateProfile,
    verifyMail,
    encodeReqData,
    decodeResData,
    setting,
    blogpost,
    addblog,
    contactgift,

}
