const jwt = require("jsonwebtoken");
const HTTP = require("../../constants/responseCode.constant");
const { users } = require('../models/user.model')
const passport = require("passport")
const UserSession = require("../models/userSession.model")


var ObjectId = require('mongoose').Types.ObjectId;

const http = require('http')

function verifyToken(req, res, next) {
  let token = req?.cookies?.jwttoken; //get cookie from request
  console.log("---------------token----------------------")
  console.log(token)
 
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.UNAUTHORIZED, 'message': 'invalid token', data: {} })
      } else {
        console.log(decoded.result)
        const { sessionId } = decoded.result
        

        if (!sessionId || !ObjectId.isValid(sessionId)) {
          return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Invalid session!', data: {} })
        }
        
        const result = await users.findById(decoded.result.id)
        if (!result) {
          return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Please Authenticate yourself!!', data: {} })
        }
        
        const userSession = await UserSession.findOne({ _id: sessionId, userid: decoded.result.id, isActive: true })
        // const userSession = await UserSession.findOne({ _id: sessionId })
        console.log(userSession)
        if (!userSession) {
          return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User session is expired!', data: {} })
        }
        
        decoded.result.username = result.username
        decoded.result.email = result.email
        // decoded.result.firsname = result.firstname
        // decoded.result.lastname = result.lastname
        req.user = decoded;
        req.user.sessionId = sessionId
        // To Write a Cookie
        // res.writeHead(200, {
        //     "Set-Cookie": `mycookie=test`,
        //     "Content-Type": `text/plain`
        // });
        next();
      }
    });
  } else {
    return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.UNAUTHORIZED, 'message': 'Access Denied! Unauthorized User', data: {} })
  }
}

function verifyResetPasswordToken(req, res, next) {
  let token = req?.cookies?.jwttoken; //get cookie from request
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.UNAUTHORIZED, 'message': 'invalid token', data: {} })
      } else {
        const result = await users.findById(decoded.result.id)
        if (!result) {
          return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Please Uthenticate yourself!!', data: {} })
        }

        decoded.result.username = result.username
        decoded.result.email = result.email
        decoded.result.countryCode = result.countryCode
        decoded.result.phoneNumber = result.phoneNumber
        req.user = decoded;
        next();
      }
    });
  } else {
    return res.status(HTTP.SUCCESS).send({ 'success': false, 'code': HTTP.UNAUTHORIZED, 'message': 'Access Denied! Unauthorized User', data: {} })
  }
}

//admin authorization
function authAdmin(req, res, next) {
  // passport.authenticate('jwt', { session: false }, async function (err, userData, info, status) {
  //     try {
  //         if (err) {
  //             console.log(err)
  //             return next(err)
  //         }
          
  //         const { user, sessionId } = userData
  //         console.log("---------------authAdmin----------------")
  //         console.log(userData)
  //         console.log(info)
  //         console.log(status)
  //         // console.log(userData)

  //         if (!user || user.role !== "admin") {
  //             return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.UNAUTHORIZED, 'message': 'Please authenticate your-self', data: {} });
  //         }

  //         //if user blocked
  //         // if (user && user.active === false) {
  //         //     return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Your Account is De-activated!', data: {} })
  //         // }

  //         // if (!sessionId || !ObjectId.isValid(sessionId)) {
  //         //     return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Invalid session!', data: { sessionExpired: true } })
  //         // }

  //         // const adminSession = await AdminSession.findOne({ _id: sessionId, adminid: user._id, isActive: true })
  //         // if (!adminSession) {
  //         //     return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User session is expired!', data: { sessionExpired: true } })
  //         // }

  //         req.user = user
  //         req.user.sessionId = sessionId
  //         return next()
  //     } catch (e) {
  //         console.log("error from admin middleware", e);
  //         return next()
  //     }
  // })(req, res, next);
  passport.authenticate('jwt',{ session: false },async function (err, user, info, status) {
      try {

        if (err) {
          console.log(err);
          return next(err);
        }
        
        console.log("--------------------------------authAdmin---------------------------------")
        // console.log(user);
        // console.log(user.sessionId)
        // console.log(info);
        // console.log(status);
        // console.log(info)


        if (!user) { 
          return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, message: "Please authenticate your-self", data: {},});
        }

        req.user = user;
        return next();

      } catch(e) {
          console.log("error from admin middleware", e);
          return next();
      }
    }
  )(req, res, next);
}



//user authorization
function authUser(req, res, next) {
  passport.authenticate('jwt', { session: false }, async function (err, userData, info, status) {
      try {
          if (err) {
              console.log(err)
              return next(err)
          }

          const { user, sessionId } = userData
          console.log(" ---------------authUser------------------- ")
          // console.log(userData)
          // console.log("---------------------user----------------------")
          // console.log(user)
          // console.log("--------------------session----------------------")
          // console.log(sessionId);
          // console.log(info)
          // console.log(status)
          // console.log(user)
          

          if (!user || user.role !== "user") {
              return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.UNAUTHORIZED, 'message': 'Please authenticate your-self', data: {} });
          }


          if (!sessionId || !ObjectId.isValid(sessionId)) {
              return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Invalid session!', data: {} })
          }

          const userSession = await UserSession.findOne({ _id: sessionId, userid: user._id, isActive: true })
          if (!userSession) {
              return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User session is expired!', data: {} })
          }

          req.user = user
          req.user.sessionId = sessionId
          return next()
      } catch (e) {
          console.log("error from user middleware", e);
          return next()
      }
  })(req, res, next);
}




module.exports = { verifyToken, verifyResetPasswordToken, authAdmin, authUser}