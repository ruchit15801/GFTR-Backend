const { users } = require('../../app/models/user.model')
// const { nodes } = require('../../app/models/nodes.model')
const UserSession = require("../../app/models/userSession.model")
const { sign } = require("jsonwebtoken");
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
// const LevelChild = require('../../app/models/levelChild.model')
const handlebars = require('handlebars')
const fs = require('file-system')

//Encrypt User Model
async function encryptUserModel(data) {
    const userData = new users(data);
    userData.encryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY });
    return userData
}

// Encrypt Node Model
async function encryptNodeModel(data) {
    const nodeData = new nodes(data);
    nodeData.encryptFieldsSync({ __secret__: process.env.DATABASE_ACCESS_KEY });
    return nodeData
}

//Formate user data
async function formateUserData(user) {
    user = user.toObject()
    delete user.__enc_email
    delete user.__enc_displayName
    delete user.__enc_referralCode
    delete user._id
    delete user.otpCheck
    delete user.__enc_walletAmt_d
    delete user.__enc_walletAmt
    delete user.__enc_username
    delete user.__enc_firstname
    delete user.__enc_lastname
    delete user.password
    delete user.updatedAt
    delete user.createdAt
    return user
}

// Formate node data
async function formateNodeData(node) {
    node = node.toObject()
    delete node.__enc_name
    delete node.__enc_type
    delete node.__enc_currency_d
    delete node.__enc_currency
    delete node.__enc_price_d
    delete node.__enc_price
    delete node.__enc_quantity_d
    delete node.__enc_quantity
    delete node.__enc_rarity
    // delete node._id
    delete node.__enc_finance_details_d
    delete node.__enc_finance_details
    delete node.__enc_supplies_d
    delete node.__enc_supplies
    delete node.createdAt
    delete node.updatedAt
    return node
}

//genrate JWT token store user session
async function createSessionAndJwtToken(user) {
    try {
        const expAt = (new Date().getTime() / 1000) + 86400
        // let token = ""

        const userSession = await new UserSession({ userid: user._id, isActive: true, expAt: expAt.toFixed() }).save()
        if (!userSession) {
            throw ("Unable to store user session.")
        }
        // let payload = { result: { id: user._id, sessionId: userSession._id } }
        // token = sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

        // sign the JWT token
        // const payload = { email: user.email, id: user._id, sessionId: userSession._id }
        // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "Id" })

        console.log("---------------create session and jwt token----------------------")

        //sign the JWT token
        const payload = { email: user.email, id: user._id, sessionId: userSession._id }
        // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" })
        const token = jwt.sign(payload, process.env.JWT_SECRET)
        console.log(token)

        return token

    } catch (e) {
        console.log(e);
        throw ("Unable to create session or genrate JWT token")
    }
}

//Expire session
async function checkSessionExpiration() {
    try {
        setInterval(async () => {
            await UserSession.updateMany({
                isActive: true,
                $and: [{ expAt: { $ne: 0 } }, { expAt: { $lte: new Date().getTime() / 1000 } }]
            }, { $set: { isActive: false } })
        }, 1000);
    } catch (err) {
        console.log(err)
    }
}

// send welcome email
async function sendWelcomeEmail(email, subject, html) {
    try {
        let transporter = nodemailer.createTransport({
            host: "mail.privateemail.com",
            port: 465,
            secure: true,
            auth: {
                user: "hello@GFTRcoin.io",
                pass: "GFTR009$"
            }

        });
        var mailOptions = {
            // from:"test.user25112020@gmail.com",
            from: "hello@GFTRcoin.io",
            to: email,
            subject: subject,
            html: html
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("error" + error)
                return ({ status: false, data: [], message: 'Could not send mail!' });
            }

            console.log("info " + info)
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            return ({ status: true, data: [], message: 'mail sent!.' });
        });
    } catch (err) {
        console.log(err)
    }
}

// send otp to email
async function sendOTPEmail(email, subject, html) {
    try {
        let transporter = await nodemailer.createTransport({
            // host: "smtp.gmail.com",//or "gmail"
            // // service: "smtp",
            // // host: "smtp.GFTRcoin.io",
            // port: 465,//optional
            // secure: true,//optional
            // auth: {
            //     user: "test.user25112020@gmail.com",
            //     pass: "zmdjwxnvoamqwbgi"
            //     // user: "noreply@GFTRcoin.io",
            //     // pass: "GFTR009$"
            //     // user: "rohanvaghasiya.technomads@gmail.com",
            //     // pass: "liyjkexbfaxubude"
            // }

            // host: "smtp.mailtrap.io",
            // port: 2525,
            // auth: {
            //   user: "44d0bcda5a8b67",
            //   pass: "06ea393ad3e3cd"
            // }


            host: "mail.privateemail.com",
            port: 465,
            secure: true,
            auth: {
                user: "noreply@GFTRcoin.io",
                pass: "GFTR009$"
            }

        });
        var mailOptions = {
            // from:"test.user25112020@gmail.com",
            from: "noreply@GFTRcoin.io",
            to: email,
            subject: subject,
            html: html
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("error" + error)
                return ({ status: false, data: [], message: 'Could not send OTP!' });
            }

            console.log("info " + info)
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            return ({ status: true, data: [], message: 'OTP sent!.' });
        });

    } catch (err) {
        console.log(err)
    }
}

//setchild when user is verified
async function setChild(result, eventEmitter) {
    let level0parent = result
    if (!level0parent) {
        return
    }


    //Update child of level1 parent
    const level1parent = await users.findOne({ _id: level0parent.parent })
    if (!level1parent) {
        return
    }

    eventEmitter.emit('childUpdate', level1parent)

    const level1parentexists = await LevelChild.findOne({ userid: level0parent.parent })
    const encData = await encryptUserModel({ username: level0parent.username })
    const level1 = { childId: level0parent._id, username: encData.username }

    if (!level1parentexists) {
        var level1Child = await new LevelChild({
            userid: level0parent.parent,
            parent: level1parent.parent,
            level1
        }).save()
    } else {
        level1Child = await LevelChild.findOneAndUpdate({ userid: level0parent.parent }, { $push: { "level1": level1 } }, { new: true })
    }

    //Update child of level2 parent
    if (!level1Child) {
        return
    }

    const level2parent = await users.findOne({ _id: level1Child.parent })
    if (!level2parent) {
        return
    }

    eventEmitter.emit('childUpdate', level2parent)

    const level2parentexists = await LevelChild.findOne({ userid: level1Child.parent })
    const level2 = { childId: level0parent._id, username: encData.username }

    if (!level2parentexists) {
        var level2Child = await new LevelChild({
            userid: level1Child.parent,
            parent: level2parent.parent,
            level2
        }).save()
    } else {
        level2Child = await LevelChild.findOneAndUpdate({ userid: level1Child.parent }, { $push: { "level2": level2 } }, { new: true })
    }

    // console.log("level2parentexists =>", level2parentexists);
    // console.log("level2parent =>", level2parent);

    //Update child of level3 parent
    // if (!level2Child) {
    //     return
    // }

    // const level3parent = await users.findOne({ _id: level2Child.parent })
    // if (!level3parent) {
    //     return
    // }

    // eventEmitter.emit('childUpdate', level3parent)

    // const level3parentexists = await LevelChild.findOne({ userid: level2Child.parent })
    // const level3 = { childId: level0parent._id, username: encData.username }

    // if (!level3parentexists) {
    //     var level3Child = await new LevelChild({
    //         userid: level2Child.parent,
    //         parent: level3parent.parent,
    //         level3
    //     }).save()
    // } else {
    //     level3Child = await LevelChild.findOneAndUpdate({ userid: level2Child.parent }, { $push: { "level3": level3 } }, { new: true })
    // }

    // // console.log("level3parentexists =>", level3parentexists);
    // // console.log("level3parent =>", level3parent);


    // //Update child of level4 parent
    // if (!level3Child) {
    //     return
    // }

    // const level4parent = await users.findOne({ _id: level3Child.parent })
    // if (!level4parent) {
    //     return
    // }

    // eventEmitter.emit('childUpdate', level4parent)

    // const level4parentexists = await LevelChild.findOne({ userid: level3Child.parent })
    // const level4 = { childId: level0parent._id, username: encData.username }

    // if (!level4parentexists) {
    //     var level4Child = await new LevelChild({
    //         userid: level3Child.parent,
    //         parent: level4parent.parent,
    //         level4
    //     }).save()
    // } else {
    //     level4Child = await LevelChild.findOneAndUpdate({ userid: level3Child.parent }, { $push: { "level4": level4 } }, { new: true })
    // }

    // // console.log("level4parentexists =>", level4parentexists);
    // // console.log("level4parent =>", level4parent);


    // //Update child of level5 parent
    // if (!level4Child) {
    //     return
    // }

    // const level5parent = await users.findOne({ _id: level4Child.parent })
    // if (!level5parent) {
    //     return
    // }

    // eventEmitter.emit('childUpdate', level5parent)

    // const level5parentexists = await LevelChild.findOne({ userid: level4Child.parent })
    // const level5 = { childId: level0parent._id, username: encData.username }

    // if (!level5parentexists) {
    //     var level5Child = await new LevelChild({
    //         userid: level4Child.parent,
    //         parent: level5parent.parent,
    //         level5
    //     }).save()
    // } else {
    //     level5Child = await LevelChild.findOneAndUpdate({ userid: level4Child.parent }, { $push: { "level5": level5 } }, { new: true })
    // }

    // // console.log("level5parentexists =>", level5parentexists);
    // // console.log("level5parent =>", level5parent);
    return
}

// send welcome email template
const sendEmail = (sendData) => {
    try {

        return new Promise(async resolve => {
            var file_template = sendData.file_template
            var subject = sendData.subject

            let transporter = nodemailer.createTransport({
                host: "mail.privateemail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "hello@GFTRcoin.io",
                    pass: "GFTR009$"
                }

            });

            fs.readFile(file_template, { encoding: 'utf-8' }, function (err, html) {
                var template = handlebars.compile(html);
                var htmlToSend = template(sendData);

                var mailOptions = {
                    from: "hello@GFTRcoin.io",
                    to: sendData.to,
                    subject: subject,
                    html: htmlToSend
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("error" + error)
                        return ({ status: false, data: [], message: 'Could not send mail!' });
                    }

                    console.log("info " + info)
                    console.log('Message sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    return ({ status: true, data: [], message: 'mail sent!.' });
                });


            });

        })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Unable to send email!", data: {} })
    }
}

// send otp email template
const sendEmailOTP = (sendData) => {
    try {

        return new Promise(async resolve => {
            var file_template = sendData.file_template
            var subject = sendData.subject

            let transporter = nodemailer.createTransport({
                host: "mail.privateemail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "noreply@GFTRcoin.io",
                    pass: "GFTR009$"
                }

            });

            fs.readFile(file_template, { encoding: 'utf-8' }, function (err, html) {
                var template = handlebars.compile(html);
                var htmlToSend = template(sendData);

                var mailOptions = {
                    from: "noreply@GFTRcoin.io",
                    to: sendData.to,
                    subject: subject,
                    html: htmlToSend
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("error" + error)
                        return ({ status: false, data: [], message: 'Could not send mail!' });
                    }

                    console.log("info " + info)
                    console.log('Message sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    return ({ status: true, data: [], message: 'mail sent!.' });
                });


            });

        })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Unable to send email!", data: {} })
    }
}


module.exports = {
    encryptUserModel,
    encryptNodeModel,
    formateUserData,
    formateNodeData,
    checkSessionExpiration,
    createSessionAndJwtToken,
    sendWelcomeEmail,
    sendOTPEmail,
    setChild,


    sendEmail,
    sendEmailOTP
}